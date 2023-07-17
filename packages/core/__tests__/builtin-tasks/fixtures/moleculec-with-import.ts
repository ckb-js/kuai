export type ClassType = 'Uint8'
export const Class: ClassType = 'Uint8'

export type HeroType = {
  type: 'table'
  value: {
    class: 'Uint8'
    level: 'Uint8'
    experiences: 'Uint32'
    hp: 'Uint16'
    mp: 'Uint16'
    base_damage: 'Uint16'
    attrs: {
      type: 'struct'
      value: {
        strength: 'Uint8'
        dexterity: 'Uint8'
        endurance: 'Uint8'
        speed: 'Uint8'
        intelligence: 'Uint8'
        wisdom: 'Uint8'
        perception: 'Uint8'
        concentration: 'Uint8'
      }
    }
    skills: {
      type: 'vec'
      value: {
        type: 'union'
        value: {
          ArmorLight: {
            type: 'option'
            value: 'Uint8'
          }
          ArmorHeavy: {
            type: 'option'
            value: 'Uint8'
          }
          ArmorShields: {
            type: 'option'
            value: 'Uint8'
          }
          WeaponSwords: {
            type: 'option'
            value: 'Uint8'
          }
          WeaponBows: {
            type: 'option'
            value: 'Uint8'
          }
          WeaponBlunt: {
            type: 'option'
            value: 'Uint8'
          }
          Dodge: {
            type: 'option'
            value: 'Uint8'
          }
          PickLocks: {
            type: 'option'
            value: 'Uint8'
          }
          Mercantile: {
            type: 'option'
            value: 'Uint8'
          }
          Survival: {
            type: 'option'
            value: 'Uint8'
          }
        }
      }
    }
  }
}
export const Hero: HeroType = {
  type: 'table',
  value: {
    class: 'Uint8',
    level: 'Uint8',
    experiences: 'Uint32',
    hp: 'Uint16',
    mp: 'Uint16',
    base_damage: 'Uint16',
    attrs: {
      type: 'struct',
      value: {
        strength: 'Uint8',
        dexterity: 'Uint8',
        endurance: 'Uint8',
        speed: 'Uint8',
        intelligence: 'Uint8',
        wisdom: 'Uint8',
        perception: 'Uint8',
        concentration: 'Uint8',
      },
    },
    skills: {
      type: 'vec',
      value: {
        type: 'union',
        value: {
          ArmorLight: {
            type: 'option',
            value: 'Uint8',
          },
          ArmorHeavy: {
            type: 'option',
            value: 'Uint8',
          },
          ArmorShields: {
            type: 'option',
            value: 'Uint8',
          },
          WeaponSwords: {
            type: 'option',
            value: 'Uint8',
          },
          WeaponBows: {
            type: 'option',
            value: 'Uint8',
          },
          WeaponBlunt: {
            type: 'option',
            value: 'Uint8',
          },
          Dodge: {
            type: 'option',
            value: 'Uint8',
          },
          PickLocks: {
            type: 'option',
            value: 'Uint8',
          },
          Mercantile: {
            type: 'option',
            value: 'Uint8',
          },
          Survival: {
            type: 'option',
            value: 'Uint8',
          },
        },
      },
    },
  },
}

export type MonsterType = {
  type: 'table'
  value: {
    hp: 'Uint16'
    damage: 'Uint16'
  }
}
export const Monster: MonsterType = {
  type: 'table',
  value: {
    hp: 'Uint16',
    damage: 'Uint16',
  },
}

export type AttributesType = {
  type: 'struct'
  value: {
    strength: 'Uint8'
    dexterity: 'Uint8'
    endurance: 'Uint8'
    speed: 'Uint8'
    intelligence: 'Uint8'
    wisdom: 'Uint8'
    perception: 'Uint8'
    concentration: 'Uint8'
  }
}
export const Attributes: AttributesType = {
  type: 'struct',
  value: {
    strength: 'Uint8',
    dexterity: 'Uint8',
    endurance: 'Uint8',
    speed: 'Uint8',
    intelligence: 'Uint8',
    wisdom: 'Uint8',
    perception: 'Uint8',
    concentration: 'Uint8',
  },
}

export type ArmorLightType = {
  type: 'option'
  value: 'Uint8'
}
export const ArmorLight: ArmorLightType = {
  type: 'option',
  value: 'Uint8',
}

export type ArmorHeavyType = {
  type: 'option'
  value: 'Uint8'
}
export const ArmorHeavy: ArmorHeavyType = {
  type: 'option',
  value: 'Uint8',
}

export type ArmorShieldsType = {
  type: 'option'
  value: 'Uint8'
}
export const ArmorShields: ArmorShieldsType = {
  type: 'option',
  value: 'Uint8',
}

export type WeaponSwordsType = {
  type: 'option'
  value: 'Uint8'
}
export const WeaponSwords: WeaponSwordsType = {
  type: 'option',
  value: 'Uint8',
}

export type WeaponBowsType = {
  type: 'option'
  value: 'Uint8'
}
export const WeaponBows: WeaponBowsType = {
  type: 'option',
  value: 'Uint8',
}

export type WeaponBluntType = {
  type: 'option'
  value: 'Uint8'
}
export const WeaponBlunt: WeaponBluntType = {
  type: 'option',
  value: 'Uint8',
}

export type DodgeType = {
  type: 'option'
  value: 'Uint8'
}
export const Dodge: DodgeType = {
  type: 'option',
  value: 'Uint8',
}

export type PickLocksType = {
  type: 'option'
  value: 'Uint8'
}
export const PickLocks: PickLocksType = {
  type: 'option',
  value: 'Uint8',
}

export type MercantileType = {
  type: 'option'
  value: 'Uint8'
}
export const Mercantile: MercantileType = {
  type: 'option',
  value: 'Uint8',
}

export type SurvivalType = {
  type: 'option'
  value: 'Uint8'
}
export const Survival: SurvivalType = {
  type: 'option',
  value: 'Uint8',
}

export type SkillType = {
  type: 'union'
  value: {
    ArmorLight: {
      type: 'option'
      value: 'Uint8'
    }
    ArmorHeavy: {
      type: 'option'
      value: 'Uint8'
    }
    ArmorShields: {
      type: 'option'
      value: 'Uint8'
    }
    WeaponSwords: {
      type: 'option'
      value: 'Uint8'
    }
    WeaponBows: {
      type: 'option'
      value: 'Uint8'
    }
    WeaponBlunt: {
      type: 'option'
      value: 'Uint8'
    }
    Dodge: {
      type: 'option'
      value: 'Uint8'
    }
    PickLocks: {
      type: 'option'
      value: 'Uint8'
    }
    Mercantile: {
      type: 'option'
      value: 'Uint8'
    }
    Survival: {
      type: 'option'
      value: 'Uint8'
    }
  }
}
export const Skill: SkillType = {
  type: 'union',
  value: {
    ArmorLight: {
      type: 'option',
      value: 'Uint8',
    },
    ArmorHeavy: {
      type: 'option',
      value: 'Uint8',
    },
    ArmorShields: {
      type: 'option',
      value: 'Uint8',
    },
    WeaponSwords: {
      type: 'option',
      value: 'Uint8',
    },
    WeaponBows: {
      type: 'option',
      value: 'Uint8',
    },
    WeaponBlunt: {
      type: 'option',
      value: 'Uint8',
    },
    Dodge: {
      type: 'option',
      value: 'Uint8',
    },
    PickLocks: {
      type: 'option',
      value: 'Uint8',
    },
    Mercantile: {
      type: 'option',
      value: 'Uint8',
    },
    Survival: {
      type: 'option',
      value: 'Uint8',
    },
  },
}

export type SkillsType = {
  type: 'vec'
  value: {
    type: 'union'
    value: {
      ArmorLight: {
        type: 'option'
        value: 'Uint8'
      }
      ArmorHeavy: {
        type: 'option'
        value: 'Uint8'
      }
      ArmorShields: {
        type: 'option'
        value: 'Uint8'
      }
      WeaponSwords: {
        type: 'option'
        value: 'Uint8'
      }
      WeaponBows: {
        type: 'option'
        value: 'Uint8'
      }
      WeaponBlunt: {
        type: 'option'
        value: 'Uint8'
      }
      Dodge: {
        type: 'option'
        value: 'Uint8'
      }
      PickLocks: {
        type: 'option'
        value: 'Uint8'
      }
      Mercantile: {
        type: 'option'
        value: 'Uint8'
      }
      Survival: {
        type: 'option'
        value: 'Uint8'
      }
    }
  }
}
export const Skills: SkillsType = {
  type: 'vec',
  value: {
    type: 'union',
    value: {
      ArmorLight: {
        type: 'option',
        value: 'Uint8',
      },
      ArmorHeavy: {
        type: 'option',
        value: 'Uint8',
      },
      ArmorShields: {
        type: 'option',
        value: 'Uint8',
      },
      WeaponSwords: {
        type: 'option',
        value: 'Uint8',
      },
      WeaponBows: {
        type: 'option',
        value: 'Uint8',
      },
      WeaponBlunt: {
        type: 'option',
        value: 'Uint8',
      },
      Dodge: {
        type: 'option',
        value: 'Uint8',
      },
      PickLocks: {
        type: 'option',
        value: 'Uint8',
      },
      Mercantile: {
        type: 'option',
        value: 'Uint8',
      },
      Survival: {
        type: 'option',
        value: 'Uint8',
      },
    },
  },
}

export type AttrValueType = 'Uint8'
export const AttrValue: AttrValueType = 'Uint8'

export type SkillLevelType = 'Uint8'
export const SkillLevel: SkillLevelType = 'Uint8'

export type Uint8Type = 'Uint8'
export const Uint8: Uint8Type = 'Uint8'

export type Uint16Type = 'Uint16'
export const Uint16: Uint16Type = 'Uint16'

export type Uint32Type = 'Uint32'
export const Uint32: Uint32Type = 'Uint32'
