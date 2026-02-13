export interface LootSchema {
  id: string;
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  properties: Property[];
}

export interface Property {
  id: string;
  type: 'Attack' | 'Defense' | 'Element' | 'Socket' | 'Affix';
  value: number;
  modifier?: 'Additive' | 'Multiplicative';
}

export interface ItemBase {
  id: string;
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  properties: Property[];
  sockets: number;
}