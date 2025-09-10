const fs = require('fs')
const path = require('path')

// Load dishes data from the parent directory
const dishesPath = path.join(__dirname, '..', '..', 'data', 'dishes.json')
const dishesData = JSON.parse(fs.readFileSync(dishesPath, 'utf8'))

// Extract unique category IDs
const categoryIds = [...new Set(dishesData.dishes.map(dish => dish.categoryId))]

console.log('📊 Unique category IDs in dishes.json:')
categoryIds.forEach(catId => {
  console.log(`  - ${catId}`)
})

console.log('\n📈 Category distribution:')
const categoryCount = {}
dishesData.dishes.forEach(dish => {
  categoryCount[dish.categoryId] = (categoryCount[dish.categoryId] || 0) + 1
})

Object.entries(categoryCount).forEach(([catId, count]) => {
  console.log(`  ${catId}: ${count} dishes`)
})
