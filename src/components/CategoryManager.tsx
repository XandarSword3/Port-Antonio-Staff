'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Save, X, Trash2, GripVertical } from 'lucide-react'
import { AppData, Category } from '../types'

interface CategoryManagerProps {
  data: AppData
  onDataChange: (data: AppData) => void
}

export default function CategoryManager({ data, onDataChange }: CategoryManagerProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<Category>>({})
  const [newCategory, setNewCategory] = useState({ name: '', order: (data.categories ? data.categories.length : 0) + 1 })

  const handleEdit = (category: Category) => {
    setEditingCategory(category.id)
    setEditingData({ ...category })
  }

  const handleSave = (categoryId: string) => {
    const updatedCategories = data.categories.map(category =>
      category.id === categoryId ? { ...category, ...editingData } : category
    )
    
    onDataChange({ ...data, categories: updatedCategories })
    setEditingCategory(null)
    setEditingData({})
  }

  const handleCancel = () => {
    setEditingCategory(null)
    setEditingData({})
  }

  const handleDelete = (categoryId: string) => {
    // Check if category has dishes
    const hasDishes = (data.dishes || []).some(dish => dish.categoryId === categoryId)
    
    if (hasDishes) {
      alert('Cannot delete category that contains dishes. Please move or delete the dishes first.')
      return
    }

    if (confirm('Are you sure you want to delete this category?')) {
      const updatedCategories = data.categories.filter(category => category.id !== categoryId)
      onDataChange({ ...data, categories: updatedCategories })
    }
  }

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return

    const newCat: Category = {
      id: `category-${Date.now()}`,
      name: newCategory.name.trim(),
      order: newCategory.order
    }

    const updatedCategories = [...data.categories, newCat]
      .sort((a, b) => a.order - b.order)

    onDataChange({ ...data, categories: updatedCategories })
    setNewCategory({ name: '', order: data.categories.length + 2 })
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updatedCategories = [...data.categories]
    const [movedCategory] = updatedCategories.splice(fromIndex, 1)
    updatedCategories.splice(toIndex, 0, movedCategory)
    
    // Update order values
    const reorderedCategories = updatedCategories.map((category, index) => ({
      ...category,
      order: index + 1
    }))

    onDataChange({ ...data, categories: reorderedCategories })
  }

  const sortedCategories = [...(data.categories || [])].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Manager</h2>
          <p className="text-gray-600">Organize your menu structure and categories</p>
        </div>
      </div>

      {/* Add New Category */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            placeholder="Category Name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            value={newCategory.order}
            onChange={(e) => setNewCategory({ ...newCategory, order: parseInt(e.target.value) })}
            placeholder="Order"
            className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategory.name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          <p className="text-sm text-gray-600">Drag to reorder categories</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sortedCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <div className="text-gray-400 cursor-move">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Order */}
                <div className="w-12 text-center">
                  <span className="text-sm font-medium text-gray-500">#{category.order}</span>
                </div>

                {/* Category Info */}
                <div className="flex-1">
                  {editingCategory === category.id ? (
                    <input
                      type="text"
                      value={editingData.name || category.name}
                      onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600">
                        {(data.dishes || []).filter(dish => dish.categoryId === category.id).length} dishes
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {editingCategory === category.id ? (
                    <>
                      <button
                        onClick={() => handleSave(category.id)}
                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={(data.dishes || []).some(dish => dish.categoryId === category.id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Category Statistics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedCategories.map(category => {
            const dishCount = (data.dishes || []).filter(dish => dish.categoryId === category.id).length
            const availableCount = (data.dishes || []).filter(dish => dish.categoryId === category.id && dish.available).length
            
            return (
              <div key={category.id} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{category.name}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Total dishes: {dishCount}</div>
                  <div>Available: {availableCount}</div>
                  <div>Order: #{category.order}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
