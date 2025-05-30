import { globalScene } from "#app/global-scene";
import { BattlerTagLapseType } from "#app/data/battler-tags";
import { PokemonPhase } from "./pokemon-phase";

export class MoveEndPhase extends PokemonPhase {
  start() {
    super.start();

    const pokemon = this.getPokemon();
    if (pokemon.isActive(true)) {
      pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);
    }

    globalScene.arena.setIgnoreAbilities(false);

    this.end();
  }
}
