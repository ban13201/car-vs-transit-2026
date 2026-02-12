// calc.js - 계산 로직만 모아두기(구조/검증 용이)

// 포맷팅
function formatKRW(n){
  if (!Number.isFinite(n)) return "-";
  return Math.round(n).toLocaleString("ko-KR") + "원";
}
function formatNumber(n, digits=0){
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: digits });
}

// 핵심 계산
function annualDistanceKm(roundTripKm, commuteDaysPerWeek){
  return roundTripKm * commuteDaysPerWeek * 52;
}

function annualFuelCost(annualKm, fuelEfficiencyKmPerL, fuelPricePerL){
  // 연비 0 방지: validate.js에서 걸러야 함
  const liters = annualKm / fuelEfficiencyKmPerL;
  return liters * fuelPricePerL;
}

function annualDepreciationStraight(carPrice, residualValue, years){
  // 단순 직선 감가: (구매가 - 잔존가)/N
  const diff = Math.max(0, carPrice - residualValue);
  return diff / years;
}

function annualCarTotal(params){
  const {
    years, annualKm,
    carPrice, residualValue,
    fuelEfficiency, fuelPricePerLiter,
    annualCarFixed, monthlyParking, monthlyTollEtc,
  } = params;

  const fuel = annualFuelCost(annualKm, fuelEfficiency, fuelPricePerLiter);
  const fixed = annualCarFixed + (monthlyParking * 12) + (monthlyTollEtc * 12);
  const dep = annualDepreciationStraight(carPrice, residualValue, years);

  return {
    fuel, fixed, dep,
    total: fuel + fixed + dep
  };
}

function annualTransitTotal(params){
  const { monthlyTransit, monthlyTransitExtra } = params;
  const total = (monthlyTransit * 12) + (monthlyTransitExtra * 12);
  return { total };
}

function annualTimeValueCost(params){
  // 시간차(대중교통 - 자차)가 +면 자차가 빠름(대중교통이 더 오래 걸림)
  const {
    commuteDaysPerWeek, carMinutes, transitMinutes, hourlyWage
  } = params;

  const tripsPerYear = commuteDaysPerWeek * 52;      // 왕복 기준
  const diffMinutesPerTrip = transitMinutes - carMinutes;
  const diffHoursPerYear = (diffMinutesPerTrip * tripsPerYear) / 60;
  const value = diffHoursPerYear * hourlyWage;

  return { diffMinutesPerTrip, diffHoursPerYear, value };
}

function buildYearlySeries(input){
  // 1~N년까지 연간/누적 비용 시리즈 생성
  const years = input.years;

  const annualKm = annualDistanceKm(input.roundTripKm, input.commuteDaysPerWeek);

  const carAnnual = annualCarTotal({
    years,
    annualKm,
    carPrice: input.carPrice,
    residualValue: input.residualValue,
    fuelEfficiency: input.fuelEfficiency,
    fuelPricePerLiter: input.fuelPricePerLiter,
    annualCarFixed: input.annualCarFixed,
    monthlyParking: input.monthlyParking,
    monthlyTollEtc: input.monthlyTollEtc,
  }).total;

  const transitAnnual = annualTransitTotal({
    monthlyTransit: input.monthlyTransit,
    monthlyTransitExtra: input.monthlyTransitExtra
  }).total;

  let carAnnualAdj = carAnnual;
  let transitAnnualAdj = transitAnnual;

  let timeRule = "시간가치 미반영";
  if (input.useTimeValue){
    const tv = annualTimeValueCost({
      commuteDaysPerWeek: input.commuteDaysPerWeek,
      carMinutes: input.carMinutes,
      transitMinutes: input.transitMinutes,
      hourlyWage: input.hourlyWage
    });

    if (tv.diffMinutesPerTrip > 0){
      // 대중교통이 더 느림 -> 대중교통 비용에 시간가치 추가
      transitAnnualAdj = transitAnnual + Math.max(0, tv.value);
      timeRule = "자차가 더 빠름 → 대중교통 비용에 시간가치(시간 손실) 추가";
    } else if (tv.diffMinutesPerTrip < 0){
      // 자차가 더 느림 -> 자차 비용에 시간가치 추가(=시간 손실)
      carAnnualAdj = carAnnual + Math.max(0, -tv.value);
      timeRule = "대중교통이 더 빠름 → 자차 비용에 시간가치(시간 손실) 추가";
    } else {
      timeRule = "소요시간 동일 → 시간가치 영향 없음";
    }
  }

  const series = [];
  let carCum = 0;
  let transitCum = 0;

  for (let y=1; y<=years; y++){
    carCum += carAnnualAdj;
    transitCum += transitAnnualAdj;
    series.push({
      year: y,
      carAnnual: carAnnualAdj,
      transitAnnual: transitAnnualAdj,
      carCum,
      transitCum
    });
  }

  return {
    annualKm,
    base: { carAnnual, transitAnnual },
    adjusted: { carAnnual: carAnnualAdj, transitAnnual: transitAnnualAdj },
    timeRule,
    series
  };
}

function findBreakEvenYear(series){
  // 누적 비용이 처음으로 역전되는 해(교차) 반환
  // - 반환 형식: {year: number, winner: "car"|"transit"} 또는 null
  for (let i=0; i<series.length; i++){
    const row = series[i];
    if (row.carCum === row.transitCum){
      return { year: row.year, winner: "tie" };
    }
    // i=0부터 확인: car가 더 싸다가 transit가 더 싸게 되는 지점(또는 반대)
    // 단순히 "부호 변경" 체크
    if (i > 0){
      const prev = series[i-1];
      const prevDiff = prev.carCum - prev.transitCum;
      const currDiff = row.carCum - row.transitCum;
      if ((prevDiff < 0 && currDiff > 0) || (prevDiff > 0 && currDiff < 0)){
        const winner = (row.carCum < row.transitCum) ? "car" : "transit";
        return { year: row.year, winner };
      }
    }
  }
  return null;
}
