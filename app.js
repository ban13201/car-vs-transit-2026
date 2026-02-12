// app.js - UI 이벤트/렌더링

function getRawInput(){
  return {
    years: readNumber("years"),

    commuteDaysPerWeek: readNumber("commuteDaysPerWeek"),
    roundTripKm: readNumber("roundTripKm"),

    carMinutes: readNumber("carMinutes"),
    transitMinutes: readNumber("transitMinutes"),

    useTimeValue: readCheckbox("useTimeValue"),
    hourlyWage: readNumber("hourlyWage"),

    carPrice: readNumber("carPrice"),
    residualValue: readNumber("residualValue"),
    fuelEfficiency: readNumber("fuelEfficiency"),
    fuelPricePerLiter: readNumber("fuelPricePerLiter"),
    annualCarFixed: readNumber("annualCarFixed"),
    monthlyParking: readNumber("monthlyParking"),
    monthlyTollEtc: readNumber("monthlyTollEtc"),

    monthlyTransit: readNumber("monthlyTransit"),
    monthlyTransitExtra: readNumber("monthlyTransitExtra"),
  };
}

function setErrors(errs){
  const box = document.getElementById("errors");
  if (!errs.length){
    box.textContent = "";
    return;
  }
  box.innerHTML = errs.map(e => `• ${e}`).join("<br/>");
}

function renderTable(series){
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  for (const row of series){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.year}년</td>
      <td>${formatKRW(row.carAnnual)}</td>
      <td>${formatKRW(row.transitAnnual)}</td>
      <td><b>${formatKRW(row.carCum)}</b></td>
      <td><b>${formatKRW(row.transitCum)}</b></td>
    `;
    tbody.appendChild(tr);
  }
}

function renderKPIs(summary){
  const last = summary.series[summary.series.length - 1];
  document.getElementById("kpiCar").textContent = formatKRW(last.carCum);
  document.getElementById("kpiTransit").textContent = formatKRW(last.transitCum);

  const be = findBreakEvenYear(summary.series);
  const beEl = document.getElementById("kpiBreakeven");
  if (!be){
    beEl.textContent = "N년 내 교차 없음";
  } else if (be.winner === "tie"){
    beEl.textContent = `${be.year}년 (동일)`;
  } else {
    beEl.textContent = `${be.year}년 (이후 ${be.winner === "car" ? "자차" : "대중교통"} 유리)`;
  }

  document.getElementById("annualKm").textContent =
    `${formatNumber(summary.annualKm, 1)} km / 년`;

  document.getElementById("timeRule").textContent = summary.timeRule;
}

function calculateAndRender(){
  const raw = getRawInput();
  const errs = validateInput(raw);
  setErrors(errs);
  if (errs.length) return;

  const summary = buildYearlySeries(raw);
  renderKPIs(summary);
  renderTable(summary.series);
}

function resetDefaults(){
  // index.html의 value 기준으로 리셋(간단하게 새로고침)
  location.reload();
}

document.getElementById("btnCalc").addEventListener("click", calculateAndRender);
document.getElementById("btnReset").addEventListener("click", resetDefaults);

// 초기 1회 자동 계산(편의)
calculateAndRender();
