// src/core/monsterCardSystem.ts
import type { GameState } from './types';
import type { RNG } from './rng';
import { enemyCardById } from './pack_enemy_cards';

export interface MonsterCardConfig {
  id: string;
  name: string;
  tier: 'normal' | 'elite' | 'boss';
  cardSystem: {
    enabled: boolean;        // เปิด/ปิด card system สำหรับ monster นี้
    handSize: number;        // ขนาดมือ
    maxEnergy: number;       // พลังงานสูงสุด
    energyPerTurn: number;   // พลังงานที่ได้ต่อเทิร์น
    deckSize: number;        // ขนาดเด็ค
    cardPool: string[];      // การ์ดที่สามารถใช้ได้
  };
  animation: {
    cardFlipDuration: number;     // เวลาพลิกการ์ด
    cardExecuteDuration: number;  // เวลาดำเนินการ
    betweenCardDelay: number;     // เวลาหน่วงระหว่างการ์ด
  };
}

export interface MonsterHandItem {
  cardId: string;
  card: any; // Card data from pack_enemy_cards
}

export class MonsterCardSystem {
  private config: MonsterCardConfig;
  private deck: string[] = [];
  private hand: string[] = [];
  private discard: string[] = [];
  private energy: number = 0;
  private isPlayingCards: boolean = false;
  private playQueue: string[] = [];
  private currentCardIndex: number = 0;

  constructor(config: MonsterCardConfig) {
    this.config = config;
    this.initializeDeck();
  }

  private initializeDeck() {
    // สร้างเด็คจาก cardPool
    const { deckSize, cardPool } = this.config.cardSystem;
    this.deck = [];

    for (let i = 0; i < deckSize; i++) {
      const cardId = cardPool[i % cardPool.length];
      this.deck.push(cardId);
    }

    this.shuffleDeck();
  }

  private shuffleDeck() {
    // Simple shuffle algorithm
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  private drawCards(count: number) {
    for (let i = 0; i < count && this.hand.length < this.config.cardSystem.handSize; i++) {
      if (this.deck.length === 0 && this.discard.length > 0) {
        // Reshuffle discard pile
        this.deck = [...this.discard];
        this.discard = [];
        this.shuffleDeck();
      }

      if (this.deck.length > 0) {
        const cardId = this.deck.pop()!;
        this.hand.push(cardId);
      }
    }
  }

  public isCardSystemEnabled(): boolean {
    return this.config.cardSystem.enabled;
  }

  public getConfig(): MonsterCardConfig {
    return this.config;
  }

  public startTurn() {
    // Reset energy
    this.energy = this.config.cardSystem.energyPerTurn;

    // Draw cards to hand size
    const cardsNeeded = this.config.cardSystem.handSize - this.hand.length;
    if (cardsNeeded > 0) {
      this.drawCards(cardsNeeded);
    }
  }

  public prepareCardSequence(): string[] {
    if (this.isPlayingCards) return [];

    // Filter playable cards (enough energy)
    const playableCards = this.hand.filter(cardId => {
      const card = enemyCardById(cardId);
      const cost = card?.energyCost ?? 1;
      return cost <= this.energy;
    });

    // Sort cards by priority (attacks first, then by energy cost)
    playableCards.sort((a, b) => {
      const cardA = enemyCardById(a);
      const cardB = enemyCardById(b);

      const scoreA = (cardA?.dmg ?? 0) * 10 - (cardA?.energyCost ?? 1);
      const scoreB = (cardB?.dmg ?? 0) * 10 - (cardB?.energyCost ?? 1);

      return scoreB - scoreA;
    });

    this.playQueue = playableCards.slice(); // Copy
    this.currentCardIndex = 0;
    this.isPlayingCards = true;

    return this.playQueue;
  }

  public getNextCardToPlay(): string | null {
    if (!this.isPlayingCards || this.currentCardIndex >= this.playQueue.length) {
      return null;
    }

    return this.playQueue[this.currentCardIndex];
  }

  public advanceCardSequence(): boolean {
    if (!this.isPlayingCards) return false;

    const currentCard = this.playQueue[this.currentCardIndex];
    if (currentCard) {
      // Remove card from hand
      const handIndex = this.hand.indexOf(currentCard);
      if (handIndex !== -1) {
        this.hand.splice(handIndex, 1);
      }

      // Add to discard
      this.discard.push(currentCard);

      // Deduct energy
      const card = enemyCardById(currentCard);
      const cost = card?.energyCost ?? 1;
      this.energy = Math.max(0, this.energy - cost);
    }

    this.currentCardIndex++;

    // Check if sequence is complete
    if (this.currentCardIndex >= this.playQueue.length) {
      this.endCardSequence();
      return false;
    }

    return true;
  }

  private endCardSequence() {
    this.isPlayingCards = false;
    this.playQueue = [];
    this.currentCardIndex = 0;

    // Discard remaining hand
    this.discard.push(...this.hand);
    this.hand = [];
  }

  public getHandForDisplay(): MonsterHandItem[] {
    return this.hand.map(cardId => ({
      cardId,
      card: enemyCardById(cardId) || { id: cardId, name: 'Unknown', type: 'attack', dmg: 1 }
    }));
  }

  public getEnergy(): number {
    return this.energy;
  }

  public getHandSize(): number {
    return this.hand.length;
  }

  public isInCardSequence(): boolean {
    return this.isPlayingCards;
  }
}

// Monster configurations
const MONSTER_CONFIGS: Record<string, MonsterCardConfig> = {
  'phi-krasue': {
    id: 'phi-krasue',
    name: 'Phi Krasue',
    tier: 'elite',
    cardSystem: {
      enabled: true,
      handSize: 3,
      maxEnergy: 3,
      energyPerTurn: 3,
      deckSize: 12,
      cardPool: ['krasue_claw', 'krasue_guard', 'krasue_swipe', 'krasue_brace']
    },
    animation: {
      cardFlipDuration: 400,
      cardExecuteDuration: 800,
      betweenCardDelay: 2000
    }
  },
  'shadow-warrior': {
    id: 'shadow-warrior',
    name: 'Shadow Warrior',
    tier: 'elite',
    cardSystem: {
      enabled: true,
      handSize: 4,
      maxEnergy: 4,
      energyPerTurn: 4,
      deckSize: 16,
      cardPool: ['shadow_strike', 'shadow_block', 'shadow_dash', 'shadow_guard']
    },
    animation: {
      cardFlipDuration: 400,
      cardExecuteDuration: 800,
      betweenCardDelay: 1800
    }
  }
};

// Global instance
let currentMonsterSystem: MonsterCardSystem | null = null;

export function initializeMonsterCardSystem(gameState: GameState, monsterId: string, rng: RNG): { rng: RNG } {
  const config = MONSTER_CONFIGS[monsterId];

  if (config && config.cardSystem.enabled) {
    currentMonsterSystem = new MonsterCardSystem(config);
    console.log(`🃏 MonsterCardSystem initialized for ${monsterId}`);
  } else {
    currentMonsterSystem = null;
    console.log(`🤖 Using AI system for ${monsterId} (no card config or disabled)`);
  }

  return { rng };
}

export function getCurrentMonsterCardSystem(): MonsterCardSystem | null {
  return currentMonsterSystem;
}

export function clearMonsterCardSystem() {
  currentMonsterSystem = null;
}