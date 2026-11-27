import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { sha256, toHex } from "../src/Shared/domain/crypto/sha256.js";
import { ExperimentId, Variant } from "../src/Experiments/domain/model/experiment.value.js";
import { parseExperimentConfig } from "../src/Experiments/domain/model/experiment-config.value.js";
import { bucket, variantFor, evaluateExperiment } from "../src/Experiments/domain/services/experiment-assigner.js";

const client = { id: 7, role: "client" };
const on = (treatmentPercent) => ({ enabled: true, treatmentPercent });
const users = Array.from({ length: 2000 }, (_, i) => i + 1);

describe("SHA-256", () => {
  // US43 - La asignación depende de un SHA-256 correcto
  it("testSha256_CoincideConImplementacionDeReferencia", () => {
    //Arrange — longitudes alrededor del límite de bloque y texto no ASCII
    const texts = ["", "abc", "ñandú ✓ 🧹", ...[55, 56, 63, 64, 65, 119, 120, 300].map((n) => "a".repeat(n))];

    //Act + Assert
    for (const text of texts) {
      expect(toHex(sha256(text))).toBe(createHash("sha256").update(text, "utf8").digest("hex"));
    }
  });
});

describe("US43 - Asignación de variantes", () => {
  // Mismos vectores que las pruebas del backend (calculados fuera de .NET)
  it.each([
    ["EC-BLQ01", 1, 68],
    ["EC-BLQ01", 2, 38],
    ["EC-BLQ01", 42, 12],
    ["EC-BLQ06", 1, 30],
    ["EC-BLQ06", 42, 55],
    ["EC-BLQ06", 1000, 25],
  ])("testAssigner_BucketIgualAlContrato %s usuario %i", (experimentId, userId, expected) => {
    expect(bucket(experimentId, userId)).toBe(expected);
  });

  it("testAssigner_TratamientoSoloSiBucketEsMenorQueElPorcentaje", () => {
    // EC-BLQ06 y el usuario 1 caen en el bucket 30
    expect(variantFor("EC-BLQ06", 1, 30)).toBe(Variant.CONTROL);
    expect(variantFor("EC-BLQ06", 1, 31)).toBe(Variant.TREATMENT);
  });

  it("testAssigner_ProporcionCercanaA50PorCiento", () => {
    //Act
    const treatment = users.filter((id) => variantFor("EC-BLQ06", id, 50) === Variant.TREATMENT).length;

    //Assert
    expect(treatment).toBeGreaterThanOrEqual(900);
    expect(treatment).toBeLessThanOrEqual(1100);
    expect(users.every((id) => variantFor("EC-BLQ06", id, 0) === Variant.CONTROL)).toBe(true);
    expect(users.every((id) => variantFor("EC-BLQ06", id, 100) === Variant.TREATMENT)).toBe(true);
  });

  it("testAssigner_ExperimentosIndependientes", () => {
    //Act — cada celda del diseño 2x2 debería recibir cerca del 25 %
    const both = users.filter((id) =>
      variantFor("EC-BLQ02", id, 50) === Variant.TREATMENT &&
      variantFor("EC-BLQ06", id, 50) === Variant.TREATMENT).length;

    //Assert
    expect(both).toBeGreaterThanOrEqual(400);
    expect(both).toBeLessThanOrEqual(600);
  });
});

describe("US43 - Evaluación del experimento", () => {
  const evaluate = (experimentId, setting, user, storedVariant) =>
    evaluateExperiment({ experimentId, setting, user, storedVariant });

  it("testEvaluate_ApagadoMantieneElFlujoVigente", () => {
    const off = evaluate(ExperimentId.BOOKING_ESTIMATE, { enabled: false, treatmentPercent: 100 }, client);
    const missing = evaluate(ExperimentId.BOOKING_ESTIMATE, undefined, client);

    for (const result of [off, missing]) {
      expect(result.inExperiment).toBe(false);
      expect(result.featureActive).toBe(false);
    }
  });

  it("testEvaluate_ApagadoIgnoraLaVarianteGuardada", () => {
    const result = evaluate(ExperimentId.BOOKING_ESTIMATE,
      { enabled: false, treatmentPercent: 100 }, client, Variant.TREATMENT);

    expect(result.featureActive).toBe(false);
  });

  it("testEvaluate_SoloClientesEnPruebasAB", () => {
    for (const user of [{ id: 9, role: "worker" }, { id: 1, role: "admin" }, null]) {
      expect(evaluate(ExperimentId.BOOKING_ESTIMATE, on(100), user).inExperiment).toBe(false);
      expect(evaluate(ExperimentId.VERIFIED_REVIEWS, on(100), user).inExperiment).toBe(false);
    }
  });

  it("testEvaluate_FaqSeActivaPorPeriodoTambienSinSesion", () => {
    const anonymous = evaluate(ExperimentId.SUPPORT_FAQ, on(0), null);

    expect(anonymous.featureActive).toBe(true);
    expect(anonymous.variant).toBe(Variant.TREATMENT);
  });

  it("testEvaluate_ConservaLaVarianteGuardada", () => {
    const result = evaluate(ExperimentId.VERIFIED_REVIEWS, on(0), client, Variant.TREATMENT);

    expect(result.variant).toBe(Variant.TREATMENT);
    expect(result.featureActive).toBe(true);
  });

  it("testEvaluate_IgnoraUnaVarianteGuardadaNoValida", () => {
    const result = evaluate(ExperimentId.VERIFIED_REVIEWS, on(100), client, "otra");

    expect(result.variant).toBe(Variant.TREATMENT);
  });
});

describe("US43 - Configuración remota", () => {
  it("testConfig_DescartaEntradasInvalidas", () => {
    //Act
    const settings = parseExperimentConfig({ experiments: [
      { id: "EC-BLQ01", enabled: true, treatmentPercent: 30 },
      { id: "EC-XX", enabled: true, treatmentPercent: 50 },
      { id: "EC-BLQ02", enabled: "true", treatmentPercent: 50 },
      { id: "EC-BLQ06", enabled: true, treatmentPercent: 101 },
      { id: "EC-BLQ04", enabled: true },
      null,
    ] });

    //Assert
    expect(settings.get("EC-BLQ01")).toEqual({ enabled: true, treatmentPercent: 30 });
    expect(settings.has("EC-XX")).toBe(false);
    expect(settings.get("EC-BLQ02").enabled).toBe(false);
    expect(settings.has("EC-BLQ06")).toBe(false);
    expect(settings.has("EC-BLQ04")).toBe(false);
  });

  it.each([null, undefined, "<!DOCTYPE html>", {}, { experiments: "x" }])(
    "testConfig_RespuestaSinLaFormaEsperada %#",
    (response) => {
      expect(parseExperimentConfig(response)).toBeNull();
    },
  );
});
