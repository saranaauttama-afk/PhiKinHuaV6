import type {CardType} from '../../src/core/types';
import type {HideWash} from './HideTexture';
/** Approved palette: faint dyed hides retain the same wrinkles and worn edges. */
export const cardTypeWash:Record<CardType,HideWash>={
 attack:{color:'#d69e8d',opacity:.32},
 action:{color:'#e4c780',opacity:.32},
 counter:{color:'#a5b8a0',opacity:.34},
 spell:{color:'#b3a7ca',opacity:.34},
 mana:{color:'#9fbed0',opacity:.34},
 prayer:{color:'#efe2bc',opacity:.30},
 equipment:{color:'#b69a7c',opacity:.32},
 curse:{color:'#aca5b5',opacity:.34},
};
