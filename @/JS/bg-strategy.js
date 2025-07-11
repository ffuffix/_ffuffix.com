const TeamColors = ['#e74c3c', '#3498db'];
const TeamCount = 2;
const UnitsPerTeam = 5;
const UnitRadius = 3.5;
const Speed = 1;
const FightDist = 22;
const LineDist = 120;
const FactoryColor = ['#ffb347', '#7ed6ff'];
const CannonColor = ['#ff7675', '#74b9ff'];
const FactoryRadius = 6;
const CannonRadius = 6;
const ProjectileRadius = 2.5;
const ProjectileSpeed = 4;
const FactoryInterval = 2900;
const CannonInterval = 3600;
const RailgunInterval = 5200;
const RailgunProjectileSpeed = 8;
const RailgunPierce = 12;
const BuildPointsPerTeam = 12;
const StructureTypes = ['factory', 'cannon', 'elixir', 'railgun'];
const StructureColors = {
  factory: FactoryColor,
  cannon: CannonColor,
  elixir: ['#ffe066', '#a29bfe'],
  railgun: ['#b2bec3', '#636e72']
};
const StructureRadius = { factory: 6, cannon: 6, elixir: 7, railgun: 8 };
const StructureHealth = { factory: 3, cannon: 2, elixir: 1, railgun: 4 };
const StructureSpeed = 0.07;
const BuildCost = { factory: 5, cannon: 7, elixir: 7, railgun: 20 };
const PointsPerSec = [0.5, 0.5];
const PointsBuildingBonus = 1.5;
let Units = [];
let Canvas, Ctx, Width, Height;
let Sparks = [];
let Projectiles = [];
let BuildPoints = [[], []];
let TeamPoints = [0, 0];
let Structures = [];
let WinTeam = null;
let WinTime = 0;

function RandomBetween(A, B) {
  return A + Math.random() * (B - A);
}

function ResizeCanvas() {
  Width = window.innerWidth;
  Height = window.innerHeight;
  Canvas.width = Width;
  Canvas.height = Height;
}

function SpawnUnits() {
  Units = [];
  for (let T = 0; T < TeamCount; ++T) {
    for (let I = 0; I < UnitsPerTeam; ++I) {
      const Angle = RandomBetween(0, Math.PI * 2);
      const Spd = RandomBetween(0.15, 0.32);
      Units.push({
        team: T,
        x: T === 0 ? RandomBetween(0, Width * 0.2) : RandomBetween(Width * 0.8, Width),
        y: RandomBetween(40, Height - 40),
        vx: Math.cos(Angle) * Spd,
        vy: Math.sin(Angle) * Spd,
        alive: true
      });
    }
  }
}

function DrawSpark(X, Y, Color) {
  Sparks.push({x: X, y: Y, color: Color, t: 0});
}

function SetupBuildPoints() {
  BuildPoints = [[], []];
  for (let T = 0; T < TeamCount; ++T) {
    for (let I = 0; I < BuildPointsPerTeam; ++I) {
      BuildPoints[T].push({
        x: T === 0 ? RandomBetween(40, Width * 0.15) : RandomBetween(Width * 0.85, Width - 40),
        y: RandomBetween(60, Height - 60),
        type: null,
        structure: null
      });
    }
  }
}

function SpawnStructures() {
  Structures = [];
  SetupBuildPoints();
  for (let T = 0; T < TeamCount; ++T) {
    const Strat = Math.floor(Math.random() * 5);
    if (Strat === 0) {
      BuildPoints[T][0].type = 'factory';
      BuildPoints[T][1].type = 'cannon';
      BuildPoints[T][0].structure = CreateStructure('factory', T, BuildPoints[T][0].x, BuildPoints[T][0].y);
      BuildPoints[T][1].structure = CreateStructure('cannon', T, BuildPoints[T][1].x, BuildPoints[T][1].y);
      Structures.push(BuildPoints[T][0].structure, BuildPoints[T][1].structure);
    } else if (Strat === 1) {
      for (let I = 0; I < 2; ++I) {
        BuildPoints[T][I].type = 'cannon';
        BuildPoints[T][I].structure = CreateStructure('cannon', T, BuildPoints[T][I].x, BuildPoints[T][I].y);
        Structures.push(BuildPoints[T][I].structure);
      }
    } else if (Strat === 2) {
      for (let I = 0; I < 2; ++I) {
        BuildPoints[T][I].type = 'factory';
        BuildPoints[T][I].structure = CreateStructure('factory', T, BuildPoints[T][I].x, BuildPoints[T][I].y);
        Structures.push(BuildPoints[T][I].structure);
      }
    } else if (Strat === 3) {
      for (let I = 0; I < 2; ++I) {
        BuildPoints[T][I].type = 'elixir';
        BuildPoints[T][I].structure = CreateStructure('elixir', T, BuildPoints[T][I].x, BuildPoints[T][I].y);
        Structures.push(BuildPoints[T][I].structure);
      }
    } else if (Strat === 4) {
      BuildPoints[T][0].type = 'elixir';
      BuildPoints[T][1].type = 'cannon';
      BuildPoints[T][0].structure = CreateStructure('elixir', T, BuildPoints[T][0].x, BuildPoints[T][0].y);
      BuildPoints[T][1].structure = CreateStructure('cannon', T, BuildPoints[T][1].x, BuildPoints[T][1].y);
      Structures.push(BuildPoints[T][0].structure, BuildPoints[T][1].structure);
    }
  }
}

function CreateStructure(Type, Team, X, Y) {
  const Angle = RandomBetween(0, Math.PI * 2);
  return {
    type: Type,
    team: Team,
    x: X,
    y: Y,
    vx: Math.cos(Angle) * StructureSpeed,
    vy: Math.sin(Angle) * StructureSpeed,
    health: StructureHealth[Type],
    buildPoint: null,
    lastAction: Date.now() + Math.random() * 1000
  };
}

function SpawnUnitForTeam(Team) {
  const AliveFactories = Structures.filter(S => S.type === 'factory' && S.team === Team && S.health > 0);
  if (!AliveFactories.length) return;
  const F = AliveFactories[Math.floor(Math.random() * AliveFactories.length)];
  const Angle = RandomBetween(0, Math.PI * 2);
  const Spd = RandomBetween(0.15, 0.32);
  Units.push({
    team: Team,
    x: F.x + RandomBetween(-8, 8),
    y: F.y + RandomBetween(-8, 8),
    vx: Math.cos(Angle) * Spd,
    vy: Math.sin(Angle) * Spd,
    alive: true
  });
}

function FireCannon(Team) {
  const AliveCannons = Structures.filter(S => S.type === 'cannon' && S.team === Team && S.health > 0);
  if (!AliveCannons.length) return;
  const C = AliveCannons[Math.floor(Math.random() * AliveCannons.length)];
  const Tx = Team === 0 ? Width - 20 : 20;
  const Ty = RandomBetween(40, Height - 40);
  const Dx = Tx - C.x;
  const Dy = Ty - C.y;
  const D = Math.sqrt(Dx*Dx + Dy*Dy);
  Projectiles.push({
    team: Team,
    x: C.x,
    y: C.y,
    vx: (Dx/D) * ProjectileSpeed,
    vy: (Dy/D) * ProjectileSpeed,
    alive: true
  });
}

function AiBuildStructures() {
  for (let T = 0; T < TeamCount; ++T) {
    let TeamStructures = Structures.filter(S => S.team === T && S.health > 0);
    const Available = BuildPoints[T].filter(BP => !BP.type);
    const MyDots = Units.filter(U => U.alive && U.team === T).length;
    const EnemyDots = Units.filter(U => U.alive && U.team !== T).length;
    
    // prioritize rebuilding destroyed structures
    if (Available.length > 0) {
      let BuiltCounts = { elixir: 0, factory: 0, cannon: 0, railgun: 0 };
      for (const BP of BuildPoints[T]) {
        if (BP.type && BuiltCounts.hasOwnProperty(BP.type)) BuiltCounts[BP.type]++;
      }
      let AliveCounts = { elixir: 0, factory: 0, cannon: 0, railgun: 0 };
      for (const Struct of TeamStructures) {
        if (AliveCounts.hasOwnProperty(Struct.type)) AliveCounts[Struct.type]++;
      }
      for (const type of StructureTypes) {
        if (BuiltCounts[type] > AliveCounts[type] && TeamPoints[T] >= BuildCost[type]) {
          const BP = Available[Math.floor(Math.random() * Available.length)];
          BP.type = type;
          const S = CreateStructure(type, T, BP.x, BP.y);
          S.buildPoint = BP;
          BP.structure = S;
          Structures.push(S);
          TeamPoints[T] -= BuildCost[type];

          continue;
        }
      }
    }

    if (EnemyDots - MyDots >= 50 && Available.length > 0) {
      const elixirCount = TeamStructures.filter(S => S.type === 'elixir').length;
      const factoryCount = TeamStructures.filter(S => S.type === 'factory').length;
      if (elixirCount < 3 && TeamPoints[T] >= BuildCost.elixir) {
        const BP = Available[Math.floor(Math.random() * Available.length)];
        BP.type = 'elixir';
        const S = CreateStructure('elixir', T, BP.x, BP.y);
        S.buildPoint = BP;
        BP.structure = S;
        Structures.push(S);
        TeamPoints[T] -= BuildCost.elixir;
        continue;
      } else if (factoryCount < 4 && TeamPoints[T] >= BuildCost.factory) {
        const BP = Available[Math.floor(Math.random() * Available.length)];
        BP.type = 'factory';
        const S = CreateStructure('factory', T, BP.x, BP.y);
        S.buildPoint = BP;
        BP.structure = S;
        Structures.push(S);
        TeamPoints[T] -= BuildCost.factory;
        continue;
      }
    }

    if (MyDots >= 45 && Available.length > 0) {
      // prefer elixir if less than 3, else factory if less than 4
      const elixirCount = TeamStructures.filter(S => S.type === 'elixir').length;
      const factoryCount = TeamStructures.filter(S => S.type === 'factory').length;
      if (elixirCount < 3 && TeamPoints[T] >= BuildCost.elixir) {
        const BP = Available[Math.floor(Math.random() * Available.length)];
        BP.type = 'elixir';
        const S = CreateStructure('elixir', T, BP.x, BP.y);
        S.buildPoint = BP;
        BP.structure = S;
        Structures.push(S);
        TeamPoints[T] -= BuildCost.elixir;
        continue;
      } else if (factoryCount < 4 && TeamPoints[T] >= BuildCost.factory) {
        const BP = Available[Math.floor(Math.random() * Available.length)];
        BP.type = 'factory';
        const S = CreateStructure('factory', T, BP.x, BP.y);
        S.buildPoint = BP;
        BP.structure = S;
        Structures.push(S);
        TeamPoints[T] -= BuildCost.factory;
        continue;
      }
    }
    // if enemy has 105+ dots, prioritize railgun
    if (EnemyDots >= 105 && Available.length > 0 && TeamPoints[T] >= BuildCost.railgun) {
      const BP = Available[Math.floor(Math.random() * Available.length)];
      BP.type = 'railgun';
      const S = CreateStructure('railgun', T, BP.x, BP.y);
      S.buildPoint = BP;
      BP.structure = S;
      Structures.push(S);
      TeamPoints[T] -= BuildCost.railgun;
      continue;
    }
    if (TeamStructures.length < 12 && Available.length > 0) {
      const CanAffordRailgun = TeamPoints[T] >= BuildCost.railgun;
      const CanAffordElixir = TeamPoints[T] >= BuildCost.elixir;
      const CanAffordCannon = TeamPoints[T] >= BuildCost.cannon;
      const CanAffordFactory = TeamPoints[T] >= BuildCost.factory;
      if (!CanAffordRailgun && TeamPoints[T] > BuildCost.railgun - 10 && Math.random() < 0.7) continue;
      if (!CanAffordElixir && TeamPoints[T] > BuildCost.elixir - 7 && Math.random() < 0.5) continue;
      let Weights = StructureTypes.map(Type => 1 + Math.random() * 1.5);
      const NumFactories = TeamStructures.filter(S => S.type === 'factory').length;
      const NumCannons = TeamStructures.filter(S => S.type === 'cannon').length;
      const NumRailguns = TeamStructures.filter(S => S.type === 'railgun').length;
      const NumElixir = TeamStructures.filter(S => S.type === 'elixir').length;
      if (NumFactories >= 2) Weights[0] = 0;
      if (NumFactories >= 4) Weights[0] = 0;
      if (NumFactories > 0 && Math.random() < 0.18) {
        Weights[0] = 0;
        Weights[1] += 1;
        Weights[2] += 1;
        Weights[3] += 1;
      }
      if (NumElixir < 2) Weights[2] += 2;
      if (Units.filter(U => U.alive && U.team !== T).length > Units.filter(U => U.alive && U.team === T).length) {
        Weights[1] += 2;
        Weights[3] += 2;
      }
      if (NumFactories > 1) {
        Weights[1] += 1;
        Weights[3] += 1;
      }
      const MyDots = Units.filter(U => U.alive && U.team === T).length;
      const EnemyDots = Units.filter(U => U.alive && U.team !== T).length;
      if (EnemyDots > MyDots) {
        Weights[1] += 2.5;
        Weights[3] += 2.5;
      }
      const Affordable = StructureTypes.filter((Type, I) => TeamPoints[T] >= BuildCost[Type]);
      const AffordableWeights = StructureTypes.map((Type, I) => Affordable.includes(Type) ? Weights[I] : 0);
      const TotalWeight = AffordableWeights.reduce((A, B) => A + B, 0);
      if (TotalWeight > 0 && Math.random() < 0.25) {
        let R = Math.random() * TotalWeight;
        let Type = StructureTypes[0];
        for (let I = 0; I < StructureTypes.length; ++I) {
          R -= AffordableWeights[I];
          if (R <= 0) { Type = StructureTypes[I]; break; }
        }
        const BP = Available[Math.floor(Math.random() * Available.length)];
        BP.type = Type;
        const Struct = CreateStructure(Type, T, BP.x, BP.y);
        Struct.buildPoint = BP;
        BP.structure = Struct;
        Structures.push(Struct);
        TeamPoints[T] -= BuildCost[Type];
      }
    } else if (TeamStructures.length >= 12 && Math.random() < 0.05) {
      let Replaceable = TeamStructures.filter(S => S.type !== 'railgun');
      if (Replaceable.length === 0) Replaceable = TeamStructures;
      const ToReplace = Replaceable[Math.floor(Math.random() * Replaceable.length)];
      if (ToReplace.buildPoint) {
        ToReplace.buildPoint.type = null;
        ToReplace.buildPoint.structure = null;
      }
      ToReplace.health = 0;
    }
  }
}

function AnimateStrategy() {
  Ctx.clearRect(0, 0, Width, Height);
  Ctx.save();
  Ctx.globalAlpha = 0.5;
  Ctx.save();
  Ctx.globalAlpha = 0.8;
  Ctx.font = 'bold 1.2em Arial';
  Ctx.textAlign = 'left';
  Ctx.textBaseline = 'bottom';
  Ctx.shadowColor = TeamColors[0];
  Ctx.shadowBlur = 8;
  Ctx.fillStyle = '#fff';
  Ctx.fillText('' + Math.floor(TeamPoints[0]), 18, Height - 8);
  Ctx.textAlign = 'right';
  Ctx.shadowColor = TeamColors[1];
  Ctx.fillText('' + Math.floor(TeamPoints[1]), Width - 18, Height - 8);
  Ctx.shadowBlur = 0;
  Ctx.restore();
  const RedDots = Units.filter(U => U.alive && U.team === 0).length;
  const BlueDots = Units.filter(U => U.alive && U.team === 1).length;
  const DotsGoal = 375;
  const BarWidth = Width;
  const BarHeight = 2;
  const BarX = 0;
  const BarY = Height - BarHeight;
  Ctx.save();
  Ctx.globalAlpha = 1;
  Ctx.fillStyle = '#000'; // bar
  Ctx.fillRect(BarX, BarY, BarWidth, BarHeight);
  const RedFrac = Math.min(RedDots / DotsGoal, 1);
  Ctx.save();
  Ctx.beginPath();
  Ctx.moveTo(BarX, BarY);
  Ctx.lineTo(BarX + BarWidth * RedFrac, BarY);
  Ctx.lineTo(BarX + BarWidth * RedFrac, BarY + BarHeight);
  Ctx.lineTo(BarX, BarY + BarHeight);
  Ctx.closePath();
  Ctx.fillStyle = TeamColors[0] + '66';
  Ctx.shadowColor = TeamColors[0] + '33';
  Ctx.shadowBlur = 6;
  Ctx.fill();
  Ctx.restore();
  const BlueFrac = Math.min(BlueDots / DotsGoal, 1);
  Ctx.save();
  Ctx.beginPath();
  Ctx.moveTo(BarX + BarWidth, BarY);
  Ctx.lineTo(BarX + BarWidth * (1 - BlueFrac), BarY);
  Ctx.lineTo(BarX + BarWidth * (1 - BlueFrac), BarY + BarHeight);
  Ctx.lineTo(BarX + BarWidth, BarY + BarHeight);
  Ctx.closePath();
  Ctx.fillStyle = TeamColors[1] + '66';
  Ctx.shadowColor = TeamColors[1] + '33';
  Ctx.shadowBlur = 6;
  Ctx.fill();
  Ctx.restore();
  Ctx.strokeStyle = '#fff3';
  Ctx.lineWidth = 1.2;
  Ctx.strokeRect(BarX, BarY, BarWidth, BarHeight);
  Ctx.font = 'bold 1em Arial';
  Ctx.fillStyle = '#fff9';
  Ctx.textAlign = 'center';
  Ctx.textBaseline = 'bottom';
  Ctx.shadowColor = '#0005';
  Ctx.shadowBlur = 3;
  Ctx.globalAlpha = 0.7;
  Ctx.fillText(`Red: ${RedDots}  |  Goal: ${DotsGoal}  |  Blue: ${BlueDots}`, Width/2, BarY - 2);
  Ctx.restore();
  for (let I = 0; I < Units.length; ++I) {
    const U = Units[I];
    if (!U.alive) continue;
    for (let J = I + 1; J < Units.length; ++J) {
      const V = Units[J];
      if (!V.alive) continue;
      const Dx = V.x - U.x;
      const Dy = V.y - U.y;
      const Dist = Math.sqrt(Dx*Dx + Dy*Dy);
      if (Dist < LineDist) {
        Ctx.save();
        Ctx.globalAlpha = 0.18 + 0.22 * (1 - Dist / LineDist);
        if (U.team === V.team) {
          Ctx.strokeStyle = TeamColors[U.team];
        } else {
          Ctx.strokeStyle = '#fff';
        }
        Ctx.lineWidth = 1.1;
        Ctx.beginPath();
        Ctx.moveTo(U.x, U.y);
        Ctx.lineTo(V.x, V.y);
        Ctx.stroke();
        Ctx.restore();
      }
    }
  }
  for (let I = Sparks.length - 1; I >= 0; --I) {
    const S = Sparks[I];
    Ctx.save();
    Ctx.globalAlpha = 0.7 * (1 - S.t / 18);
    Ctx.beginPath();
    Ctx.arc(S.x, S.y, 8 + S.t * 1.2, 0, Math.PI * 2);
    Ctx.fillStyle = S.color;
    Ctx.shadowColor = S.color;
    Ctx.shadowBlur = 12;
    Ctx.fill();
    Ctx.restore();
    S.t++;
    if (S.t > 18) Sparks.splice(I, 1);
  }
  for (const Unit of Units) {
    if (!Unit.alive) continue;
    Ctx.save();
    Ctx.globalAlpha = 0.85;
    Ctx.beginPath();
    Ctx.arc(Unit.x, Unit.y, UnitRadius, 0, Math.PI * 2);
    Ctx.fillStyle = TeamColors[Unit.team];
    Ctx.shadowColor = TeamColors[Unit.team];
    Ctx.shadowBlur = 8;
    Ctx.fill();
    Ctx.restore();
  }
  for (const Struct of Structures) {
    if (Struct.health <= 0) continue;
    Ctx.save();
    Ctx.globalAlpha = 0.9;
    Ctx.beginPath();
    Ctx.arc(Struct.x, Struct.y, StructureRadius[Struct.type], 0, Math.PI * 2);
    Ctx.fillStyle = StructureColors[Struct.type][Struct.team];
    Ctx.shadowColor = StructureColors[Struct.type][Struct.team];
    Ctx.shadowBlur = 12;
    Ctx.fill();
    Ctx.lineWidth = 2.2;
    Ctx.strokeStyle = '#fff8';
    Ctx.stroke();
    for (let H = 0; H < StructureHealth[Struct.type]; ++H) {
      Ctx.beginPath();
      Ctx.arc(Struct.x + Math.cos(H/StructureHealth[Struct.type]*Math.PI*2)*StructureRadius[Struct.type]*0.7, Struct.y + Math.sin(H/StructureHealth[Struct.type]*Math.PI*2)*StructureRadius[Struct.type]*0.7, 1.2, 0, Math.PI*2);
      Ctx.fillStyle = H < Struct.health ? '#fff' : '#fff3';
      Ctx.fill();
    }
    if (Struct.type === 'railgun') {
      Ctx.save();
      Ctx.strokeStyle = '#fff';
      Ctx.lineWidth = 2.5;
      Ctx.beginPath();
      Ctx.moveTo(Struct.x, Struct.y);
      const Angle = Math.atan2((Struct.team === 0 ? 1 : -1), 0);
      Ctx.lineTo(Struct.x + (Struct.team === 0 ? 1 : -1) * StructureRadius.railgun * 2.2, Struct.y);
      Ctx.stroke();
      Ctx.restore();
    }
    Ctx.restore();
  }
  for (const P of Projectiles) {
    if (!P.alive) continue;
    if (P.type === 'railgun') {
      // wavy offset and color pulse
      const direction = Math.sign(P.vx) || 1;
      const time = Date.now() * 0.004 + (direction > 0 ? P.x : (Width - P.x)) * 0.01;
      for (let t = 0; t < 6; ++t) {
        const wave = Math.sin(time + t * 0.7) * (6 - t) * 0.7;
        Ctx.save();
        Ctx.globalAlpha = 0.18 * (1 - t / 6);
        Ctx.beginPath();
        Ctx.arc(P.x - P.vx * t * 4, P.y - P.vy * t * 4 + wave, 18 - t * 2, 0, Math.PI * 2);
        // animated color pulse
        const pulse = 0.5 + 0.5 * Math.sin(time * 2 + t);
        const color = P.team === 0 ? `rgba(231,76,60,${0.7 + 0.3 * pulse})` : `rgba(52,152,219,${0.7 + 0.3 * pulse})`;
        Ctx.fillStyle = color;
        Ctx.shadowColor = TeamColors[P.team];
        Ctx.shadowBlur = 32 - t * 4;
        Ctx.fill();
        Ctx.restore();
      }
      Ctx.save();
      const corePulse = 0.8 + 0.2 * Math.sin(time * 3);
      Ctx.globalAlpha = 0.85 + 0.15 * corePulse;
      Ctx.beginPath();
      Ctx.arc(P.x, P.y, 8 + 2 * corePulse, 0, Math.PI * 2);
      Ctx.fillStyle = '#fff';
      Ctx.shadowColor = TeamColors[P.team];
      Ctx.shadowBlur = 24 + 8 * corePulse;
      Ctx.fill();
      Ctx.restore();
    } else {
      Ctx.save();
      Ctx.globalAlpha = 0.7;
      Ctx.beginPath();
      Ctx.arc(P.x, P.y, ProjectileRadius, 0, Math.PI * 2);
      Ctx.fillStyle = CannonColor[P.team];
      Ctx.shadowColor = CannonColor[P.team];
      Ctx.shadowBlur = 8;
      Ctx.fill();
      Ctx.restore();
    }
  }
  Ctx.restore();
  AiBuildStructures();
  for (const U of Units) {
    if (!U.alive) continue;
    U.x += U.vx;
    U.y += U.vy;
    if (U.x < UnitRadius) { U.x = UnitRadius; U.vx *= -1; }
    if (U.x > Width - UnitRadius) { U.x = Width - UnitRadius; U.vx *= -1; }
    if (U.y < UnitRadius) { U.y = UnitRadius; U.vy *= -1; }
    if (U.y > Height - UnitRadius) { U.y = Height - UnitRadius; U.vy *= -1; }
    if (Math.random() < 0.002) {
      const Angle = RandomBetween(0, Math.PI * 2);
      const Spd = RandomBetween(0.15, 0.32);
      U.vx = Math.cos(Angle) * Spd;
      U.vy = Math.sin(Angle) * Spd;
    }
  }
  for (const P of Projectiles) {
    if (!P.alive) continue;
    P.x += P.vx;
    P.y += P.vy;
    if (P.x < 0 || P.x > Width || P.y < 0 || P.y > Height) P.alive = false;
    for (const U of Units) {
      if (!U.alive || U.team === P.team) continue;
      const Dx = U.x - P.x;
      const Dy = U.y - P.y;
      if (Math.sqrt(Dx*Dx + Dy*Dy) < UnitRadius + ProjectileRadius + 1) {
        U.alive = false;
        P.alive = false;
        DrawSpark(U.x, U.y, CannonColor[P.team]);
        break;
      }
    }
  }
  for (const Struct of Structures) {
    if (Struct.health <= 0) continue;
    Struct.x += Struct.vx;
    Struct.y += Struct.vy;
    if (Struct.x < StructureRadius[Struct.type]) { Struct.x = StructureRadius[Struct.type]; Struct.vx *= -1; }
    if (Struct.x > Width - StructureRadius[Struct.type]) { Struct.x = Width - StructureRadius[Struct.type]; Struct.vx *= -1; }
    if (Struct.y < StructureRadius[Struct.type]) { Struct.y = StructureRadius[Struct.type]; Struct.vy *= -1; }
    if (Struct.y > Height - StructureRadius[Struct.type]) { Struct.y = Height - StructureRadius[Struct.type]; Struct.vy *= -1; }
    if (Math.random() < 0.001) {
      const Angle = RandomBetween(0, Math.PI * 2);
      Struct.vx = Math.cos(Angle) * StructureSpeed;
      Struct.vy = Math.sin(Angle) * StructureSpeed;
    }
    if (Struct.buildPoint) {
      Struct.buildPoint.x = Struct.x;
      Struct.buildPoint.y = Struct.y;
    }
    if (Struct.type === 'factory' && Struct.health > 0) {
      if (Date.now() - Struct.lastAction > FactoryInterval) {
        const Angle = RandomBetween(0, Math.PI * 2);
        const Spd = RandomBetween(0.15, 0.32);
        Units.push({
          team: Struct.team,
          x: Struct.x + RandomBetween(-8, 8),
          y: Struct.y + RandomBetween(-8, 8),
          vx: Math.cos(Angle) * Spd,
          vy: Math.sin(Angle) * Spd,
          alive: true
        });
        Struct.lastAction = Date.now();
      }
    }
    if (Struct.type === 'cannon' && Struct.health > 0) {
      if (Date.now() - Struct.lastAction > CannonInterval) {
        const Tx = Struct.team === 0 ? Width - 20 : 20;
        const Ty = RandomBetween(40, Height - 40);
        const Dx = Tx - Struct.x;
        const Dy = Ty - Struct.y;
        const D = Math.sqrt(Dx*Dx + Dy*Dy);
        Projectiles.push({
          team: Struct.team,
          x: Struct.x,
          y: Struct.y,
          vx: (Dx/D) * ProjectileSpeed,
          vy: (Dy/D) * ProjectileSpeed,
          alive: true
        });
        Struct.lastAction = Date.now();
      }
    }
    if (Struct.type === 'railgun' && Struct.health > 0) {
      if (Date.now() - Struct.lastAction > RailgunInterval) {
        // Lazer ball
        const Dir = Struct.team === 0 ? 1 : -1;
        const speed = RailgunProjectileSpeed;
        Projectiles.push({
          team: Struct.team,
          x: Struct.x,
          y: Struct.y,
          vx: Dir * speed,
          vy: 0,
          alive: true,
          pierce: RailgunPierce,
          type: 'railgun'
        });
        Struct.lastAction = Date.now();
      }
    }
  }
  for (const P of Projectiles) {
    if (!P.alive) continue;
    let PierceLeft = P.pierce || 0;

    const HitRadius = (P.type === 'railgun') ? 18 : ProjectileRadius;
    for (const Struct of Structures) {
      if (Struct.health <= 0 || Struct.team === P.team) continue;
      const Dx = Struct.x - P.x;
      const Dy = Struct.y - P.y;
      if (Math.sqrt(Dx*Dx + Dy*Dy) < StructureRadius[Struct.type] + HitRadius + 1) {
        Struct.health--;
        DrawSpark(Struct.x, Struct.y, StructureColors[Struct.type][Struct.team]);
        if (Struct.health <= 0) {
          if (Struct.buildPoint) { Struct.buildPoint.type = null; Struct.buildPoint.structure = null; }
        }
        if (PierceLeft > 0) {
          P.pierce = --PierceLeft;
        } else {
          P.alive = false;
          break;
        }
      }
    }
  }
  for (const P of Projectiles) {
    if (!P.alive) continue;
    let PierceLeft = P.pierce || 0;

    const hitRadius = (P.type === 'railgun') ? 18 : ProjectileRadius;
    for (const U of Units) {
      if (!U.alive || U.team === P.team) continue;
      const Dx = U.x - P.x;
      const Dy = U.y - P.y;
      if (Math.sqrt(Dx*Dx + Dy*Dy) < UnitRadius + hitRadius + 1) {
        U.alive = false;
        DrawSpark(U.x, U.y, CannonColor[P.team]);
        if (PierceLeft > 0) {
          P.pierce = --PierceLeft;
        } else {
          P.alive = false;
          break;
        }
      }
    }
  }
  // bullet-bullet collision
  for (let i = 0; i < Projectiles.length; ++i) {
    const P1 = Projectiles[i];
    if (!P1.alive || P1.type === 'railgun') continue;
    for (let j = i + 1; j < Projectiles.length; ++j) {
      const P2 = Projectiles[j];
      if (!P2.alive || P2.type === 'railgun') continue;
      if (P1.team !== P2.team) {
        const dx = P1.x - P2.x;
        const dy = P1.y - P2.y;
        if (Math.sqrt(dx*dx + dy*dy) < ProjectileRadius * 2 + 1) {
          P1.alive = false;
          P2.alive = false;
        }
      }
    }
  }
  const Now = Date.now();
  for (let T = 0; T < TeamCount; ++T) {
    let Bonus = 0;
    for (const S of Structures) {
      if (S.health > 0 && S.team === T && S.type === 'elixir') Bonus++;
    }
    if (!TeamPoints._last) TeamPoints._last = Now;
    const Dt = (Now - (TeamPoints._last || Now)) / 1000;
    // TeamPoints[T] / 10
    TeamPoints[T] += PointsPerSec[T] * Dt + (Bonus > 0 ? (0.5 * Bonus) * Dt : 0);
  }
  TeamPoints._last = Now;
  let Winner = null;
  if (RedDots >= DotsGoal) Winner = 0;
  if (BlueDots >= DotsGoal) Winner = 1;
  if (Winner !== null) {
    Ctx.save();
    Ctx.globalAlpha = 0.92;
    Ctx.font = 'bold 2.6em Arial';
    Ctx.textAlign = 'center';
    Ctx.textBaseline = 'middle';
    Ctx.shadowColor = TeamColors[Winner];
    Ctx.shadowBlur = 24;
    Ctx.fillStyle = '#fff';
    Ctx.fillText((Winner === 0 ? 'Red' : 'Blue') + ' Team Wins!', Width / 2, Height / 2);
    Ctx.restore();
    setTimeout(() => {
      TeamPoints[0] = 10;
      TeamPoints[1] = 10;
      SpawnUnits();
      SpawnStructures();
      SetupBuildPoints();
    }, 3000);
    return;
  }
  requestAnimationFrame(AnimateStrategy);
}

function SetupBgStrategy() {
  let Bg = document.getElementById('bg-points');
  if (Bg) Bg.remove();
  let Bg2 = document.getElementById('bg-circles');
  if (Bg2) Bg2.remove();
  Canvas = document.createElement('canvas');
  Canvas.id = 'bg-strategy';
  Canvas.style.position = 'fixed';
  Canvas.style.top = '0';
  Canvas.style.left = '0';
  Canvas.style.width = '100vw';
  Canvas.style.height = '100vh';
  Canvas.style.zIndex = '0';
  Canvas.style.pointerEvents = 'none';
  document.body.prepend(Canvas);
  Ctx = Canvas.getContext('2d');
  ResizeCanvas();
  SpawnUnits();
  SpawnStructures();
  SetupBuildPoints();
  window.addEventListener('resize', () => {
    ResizeCanvas();
    SpawnUnits();
    SpawnStructures();
    SetupBuildPoints();
  });
  AnimateStrategy();
}

document.addEventListener('DOMContentLoaded', SetupBgStrategy);
