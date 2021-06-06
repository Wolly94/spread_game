type PropUtils<T> = {
  combine: (a: T, b: T) => T;
  default: T;
};

export interface AttackerFightProps {
  combatAbilityModifier: number;
}

export const combineAttackerFightProps: PropUtils<AttackerFightProps> = {
  combine: (a, b) => {
    return {
      combatAbilityModifier: a.combatAbilityModifier + b.combatAbilityModifier,
    };
  },
  default: { combatAbilityModifier: 0 },
};

export interface DefenderFightProps {
  combatAbilityModifier: number;
  membraneAbsorption: number;
}

export const isDefenderFightProps = (
  fightProps: any
): fightProps is DefenderFightProps => {
  return fightProps.membraneAbsorption !== undefined;
};

export const combineDefenderFightProps: PropUtils<DefenderFightProps> = {
  combine: (a, b) => {
    return {
      combatAbilityModifier: a.combatAbilityModifier + b.combatAbilityModifier,
      membraneAbsorption: a.membraneAbsorption + b.membraneAbsorption,
    };
  },
  default: { combatAbilityModifier: 0, membraneAbsorption: 0 },
};

export interface ConquerCellProps {
  additionalUnits: number;
}

export const combineConquerCellProps: PropUtils<ConquerCellProps> = {
  combine: (a, b) => {
    return {
      additionalUnits: a.additionalUnits + b.additionalUnits,
    };
  },
  default: { additionalUnits: 0 },
};

export interface DefendCellProps {
  additionalUnits: number;
}

export const combineDefendCellProps: PropUtils<DefendCellProps> = {
  combine: (a, b) => {
    return {
      additionalUnits: a.additionalUnits + b.additionalUnits,
    };
  },
  default: { additionalUnits: 0 },
};
