import { LootSchema, Property, ItemBase } from './schema';

export const generateLoot = (): ItemBase[] => {
  const items: ItemBase[] = [];
  
  // Generate 10 unique items with different rarities
  const rarities: ('Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary')[] = 
    ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  
  for (let i = 0; i < 10; i++) {
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const properties: Property[] = [];
    
    // Generate random properties based on rarity
    const propertyCount = rarity === 'Legendary' ? 5 : 
                        rarity === 'Epic' ? 4 :
                        rarity === 'Rare' ? 3 :
                        rarity === 'Uncommon' ? 2 : 1;
    
    for (let j = 0; j < propertyCount; j++) {
      const types: ('Attack' | 'Defense' | 'Element' | 'Socket' | 'Affix')[] = 
        ['Attack', 'Defense', 'Element', 'Socket', 'Affix'];
      const type = types[Math.floor(Math.random() * types.length)];
      const value = Math.floor(Math.random() * 100) + 1;
      
      properties.push({
        id: `prop-${Date.now()}-${j}`,
        type,
        value,
        modifier: Math.random() > 0.5 ? 'Additive' : 'Multiplicative'
      });
    }
    
    items.push({
      id: `item-${Date.now()}-${i}`,
      name: `${rarity} Item ${i + 1}`,
      rarity,
      properties,
      sockets: Math.floor(Math.random() * 6) + 1
    });
  }
  
  return items;
};

export const getItemById = (id: string, items: ItemBase[]): ItemBase | undefined => {
  return items.find(item => item.id === id);
};