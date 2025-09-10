'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Save, X, Upload, Image as ImageIcon } from 'lucide-react'
import { Dish, Category } from '../types'
import { supabase } from '../lib/supabase'

interface MenuManagerProps {
  dishes: Dish[]
  categories: Category[]
  onUpdate: (dishes: Dish[]) => void
}

export default function MenuManager({ dishes: initialDishes, categories, onUpdate }: MenuManagerProps) {
  const [dishes, setDishes] = useState<Dish[]>(initialDishes)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState<Partial<Dish>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load real dishes from database
  useEffect(() => {
    loadDishesFromDB()
  }, [])

  const loadDishesFromDB = async () => {
    try {
      if (!supabase) {
        console.log('Supabase not configured, using props data')
        setDishes(initialDishes)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading dishes:', error)
        setDishes(initialDishes)
        setLoading(false)
        return
      }

      console.log('✅ Loaded real dishes from database:', data?.length)
      const transformedDishes = data?.map(dish => ({
        id: dish.id,
        name: dish.name,
        shortDesc: dish.short_desc || '',
        fullDesc: dish.full_desc || '',
        price: dish.price || 0,
        categoryId: dish.category_id || 'appetizers',
        available: dish.available !== false,
        image: dish.image_url || '/images/placeholder.jpg',
        dietTags: [],
        allergens: [],
        ingredients: [],
        currency: dish.currency || 'USD',
        imageVariants: { src: dish.image_url || '/images/placeholder.jpg' },
        rating: 4.5,
        reviewCount: 0,
        sponsored: false
      })) || []

      setDishes(transformedDishes)
      onUpdate(transformedDishes)
      setLoading(false)
    } catch (error) {
      console.error('Error in loadDishesFromDB:', error)
      setDishes(initialDishes)
      setLoading(false)
    }
  }

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish)
    setFormData(dish)
    setIsAddingNew(false)
  }

  const handleAddNew = () => {
    setEditingDish(null)
    setFormData({
      id: '',
      name: '',
      shortDesc: '',
      fullDesc: '',
      price: 0,
      categoryId: '',
      available: true,
      image: '/images/placeholder.jpg',
      dietTags: [],
      allergens: [],
      ingredients: [],
      currency: 'USD',
      imageVariants: { src: '/images/placeholder.jpg' },
      rating: 0,
      reviewCount: 0,
      sponsored: false
    })
    setIsAddingNew(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (!supabase) {
        console.error('Supabase not configured')
        setSaving(false)
        return
      }

      if (editingDish) {
        // Update existing dish
        const { error } = await supabase
          .from('dishes')
          .update({
            name: formData.name,
            short_desc: formData.shortDesc,
            full_desc: formData.fullDesc,
            price: formData.price,
            category_id: formData.categoryId,
            available: formData.available,
            image_url: formData.image,
            currency: formData.currency || 'USD'
          })
          .eq('id', editingDish.id)

        if (error) {
          console.error('Error updating dish:', error)
          alert('Error updating dish. Please try again.')
          setSaving(false)
          return
        }
        console.log('✅ Dish updated successfully')
      } else {
        // Add new dish
        const { error } = await supabase
          .from('dishes')
          .insert({
            name: formData.name,
            short_desc: formData.shortDesc,
            full_desc: formData.fullDesc,
            price: formData.price,
            category_id: formData.categoryId,
            available: formData.available !== false,
            image_url: formData.image || '/images/placeholder.jpg',
            currency: formData.currency || 'USD'
          })

        if (error) {
          console.error('Error adding dish:', error)
          alert('Error adding dish. Please try again.')
          setSaving(false)
          return
        }
        console.log('✅ Dish added successfully')
      }

      // Reload dishes from database
      await loadDishesFromDB()
      
      setEditingDish(null)
      setIsAddingNew(false)
      setFormData({})
      
      alert('Menu item saved successfully! Changes are now in the database.')
    } catch (error) {
      console.error('Error saving dish:', error)
      alert('Error saving menu item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const autoCommitToGitHub = async (updatedDishes: Dish[]) => {
    try {
      console.log('🔄 Starting auto-commit process...')
      
      const menuData = {
        dishes: updatedDishes,
        categories: categories,
        lastUpdated: new Date().toISOString()
      }

      // Get the auth token from localStorage
      const authToken = localStorage.getItem('adminToken')
      console.log('🔐 Auth token available:', !!authToken)
      
      if (!authToken) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('/api/auto-commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include', // Include httpOnly cookies as well
        body: JSON.stringify({ menuData })
      })

      console.log('📡 Auto-commit response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Auto-commit failed:', errorData)
        throw new Error(`Auto-commit failed: ${errorData.error || 'Unknown error'}`)
      }

      const result = await response.json()
      console.log('✅ Auto-commit successful:', result)
      
      // Show success notification
      setTimeout(() => {
        alert(`🚀 Changes committed to GitHub successfully! Vercel will rebuild automatically.\n\nCommit: ${result.commitUrl || 'View on GitHub'}`)
      }, 1000)
      
      return result
    } catch (error: any) {
      console.error('❌ Auto-commit error:', error)
      alert(`⚠️ Local changes saved but auto-commit failed: ${error.message}\n\nYou may need to check your GitHub token configuration.`)
      throw error
    }
  }

  const generateUpdatedMenuFile = (updatedDishes: Dish[]) => {
    try {
      // Create the complete menu data structure
      const menuData = {
        dishes: updatedDishes,
        categories: categories,
        ads: [] // You can include ads here if needed
      }
      
      // Generate downloadable file
      const dataStr = JSON.stringify(menuData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = 'menu-data.json'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('📁 Updated menu-data.json downloaded! Replace the file in /public/ and redeploy to make changes permanent for all users.')
    } catch (error) {
      console.error('Error generating menu file:', error)
    }
  }

  const handleDelete = async (dishId: string) => {
    if (confirm('Are you sure you want to delete this dish?')) {
      try {
        if (!supabase) {
          console.error('Supabase not configured')
          return
        }

        const { error } = await supabase
          .from('dishes')
          .delete()
          .eq('id', dishId)

        if (error) {
          console.error('Error deleting dish:', error)
          alert('Error deleting dish. Please try again.')
          return
        }

        console.log('✅ Dish deleted successfully')
        
        // Reload dishes from database
        await loadDishesFromDB()
        
        alert('Menu item deleted successfully!')
      } catch (error) {
        console.error('Error in handleDelete:', error)
        alert('Error deleting menu item. Please try again.')
      }
    }
  }

  const handleCancel = () => {
    setEditingDish(null)
    setIsAddingNew(false)
    setFormData({})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading menu items from database...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Menu Manager</h2>
        <div className="flex gap-3">
          <motion.button
            onClick={() => generateUpdatedMenuFile(dishes)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload className="h-4 w-4" />
            Export Data
          </motion.button>
          <motion.button
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-4 w-4" />
            Add New Dish
          </motion.button>
        </div>
      </div>

      {/* Dishes List */}
      <div className="grid gap-4">
        {dishes.map((dish) => (
          <motion.div
            key={dish.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{dish.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{dish.shortDesc}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg font-bold text-blue-600">${dish.price}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    dish.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dish.available ? 'Available' : 'Unavailable'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Category: {categories.find(c => c.id === dish.categoryId)?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => handleEdit(dish)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit className="h-4 w-4" />
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(dish.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {(editingDish || isAddingNew) && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {isAddingNew ? 'Add New Dish' : 'Edit Dish'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Enter dish name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.shortDesc || ''}
                    onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Description
                  </label>
                  <textarea
                    value={formData.fullDesc || ''}
                    onChange={(e) => setFormData({ ...formData, fullDesc: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Detailed description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.categoryId || ''}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image || ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available ?? true}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 text-sm text-gray-700">
                    Available
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
