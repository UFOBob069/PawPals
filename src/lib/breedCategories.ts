export const BREED_CATEGORIES = {
  sizes: [
    'Tiny (under 5 lbs)',
    'Small (5-20 lbs)',
    'Medium (21-50 lbs)',
    'Large (51-90 lbs)',
    'Extra Large (90+ lbs)'
  ],
  smallBreeds: [
    'Dachshund',
    'French Bulldog',
    'Pug',
    'Yorkshire Terrier',
    'Chihuahua',
    'Shih Tzu'
  ],
  mediumBreeds: [
    'Border Collie',
    'Bulldog',
    'Beagle',
    'Cocker Spaniel',
    'Australian Shepherd',
    'Corgi'
  ],
  largeBreeds: [
    'German Shepherd',
    'Golden Retriever',
    'Labrador Retriever',
    'Husky',
    'Doberman',
    'Rottweiler'
  ]
};

export const ALL_BREEDS = [
  ...BREED_CATEGORIES.sizes,
  ...BREED_CATEGORIES.smallBreeds,
  ...BREED_CATEGORIES.mediumBreeds,
  ...BREED_CATEGORIES.largeBreeds
]; 