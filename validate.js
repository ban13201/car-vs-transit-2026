// validate.js - 입력 검증(엣지케이스 방지)

function readNumber(id){
  const el = document.getElementById(id);
  const v = Number(el.value);
  return v;
}

function readCheckbox(id){
  return document.getElementById(id).checked;
}

function validateInput(raw){
  const errors = [];

  // 기간
  if (!Number.isFinite(raw.years) || raw.years < 1 || raw.years > 10){
    errors.push("기간(N년)은 1~10 사이여야 합니다.");
  }

  // 패턴
  if (!Number.isFinite(raw.commuteDaysPerWeek) || raw.commuteDaysPerWeek < 0 || raw.commuteDaysPerWeek > 14){
    errors.push("주당 출퇴근 횟수는 0~14 사이의 정수로 입력하세요.");
  }
  if (!Number.isFinite(raw.roundTripKm) || raw.roundTripKm < 0){
    errors.push("왕복 거리(km)는 0 이상이어야 합니다.");
  }

  // 시간
  if (!Number.isFinite(raw.carMinutes) || raw.carMinutes < 0){
    errors.push("자차 소요시간(분)은 0 이상이어야 합니다.");
  }
  if (!Number.isFinite(raw.transitMinutes) || raw.transitMinutes < 0){
    errors.push("대중교통 소요시간(분)은 0 이상이어야 합니다.");
  }

  // 시간가치
  if (raw.useTimeValue){
    if (!Number.isFinite(raw.hourlyWage) || raw.hourlyWage <= 0){
      errors.push("시간 가치를 반영하려면 시급(원/시간)을 1 이상으로 입력하세요.");
    }
  }

  // 자차
  const nonNegFields = [
    ["차량 구매가", raw.carPrice],
    ["잔존가", raw.residualValue],
    ["유류 단가", raw.fuelPricePerLiter],
    ["보험/정비/세금(연)", raw.annualCarFixed],
    ["주차비(월)", raw.monthlyParking],
    ["통행료/기타(월)", raw.monthlyTollEtc],
  ];
  for (const [name, val] of nonNegFields){
    if (!Number.isFinite(val) || val < 0){
      errors.push(`${name}은(는) 0 이상 숫자여야 합니다.`);
    }
  }
  if (!Number.isFinite(raw.fuelEfficiency) || raw.fuelEfficiency <= 0){
    errors.push("연비(km/L)는 0보다 큰 값이어야 합니다. (0이면 계산 불가)");
  }

  // 대중교통
  const nonNegTransit = [
    ["교통비(월)", raw.monthlyTransit],
    ["추가비(월)", raw.monthlyTransitExtra],
  ];
  for (const [name, val] of nonNegTransit){
    if (!Number.isFinite(val) || val < 0){
      errors.push(`${name}은(는) 0 이상 숫자여야 합니다.`);
    }
  }

  return errors;
}
