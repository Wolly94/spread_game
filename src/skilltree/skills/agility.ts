import { BaseAgilityPerk } from "../perks/baseAgility";
import { SpyPerk } from "../perks/spy";
import { Skill } from "../skilltree";

export const Agility: Skill = {
    name: "Agility",
    perks: [BaseAgilityPerk.createFromValues(), SpyPerk.createFromValues()],
};
