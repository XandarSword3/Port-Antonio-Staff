'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json()
}

interface Dish {
  id: string;
  name: string;
  short_desc: string;
  full_desc: string;
  price: number;
  category_id: string;
  currency: string;
  image_url: string;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
  order_index: number;
}

interface MenuManagerProps {
  dishes: Dish[];
  categories: Category[];
  onUpdate: (dishes: Dish[]) => void;
}

export default function MenuManager({ dishes: initialDishes, categories, onUpdate }: MenuManagerProps) {
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<Partial<Dish>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load real dishes from Supabase
  useEffect(() => {
    loadDishes();
  }, []);

  const loadDishes = async () => {
    try {
      // Prefer server API route (service role). Falls back to client if needed.
      let data: any[] | null = null
      try {
        const res = await apiFetch('/api/dishes')
        data = res.dishes ?? []
      } catch (e) {
        if (supabase) {
          const { data: clientData } = await supabase
            .from('dishes')
            .select('*')
            .order('name')
          data = clientData ?? []
        }
      }

      console.log('✅ Loaded dishes from database:', data?.length);
      const transformedDishes = data?.map((dish: any) => ({
        id: dish.id,
        name: dish.name,
        short_desc: dish.short_desc || '',
        full_desc: dish.full_desc || '',
        price: dish.price || 0,
        category_id: dish.category_id || 'appetizers',
        currency: dish.currency || 'USD',
        image_url: dish.image_url || '/images/placeholder.jpg',
        available: dish.available !== false
      })) || [];

      setDishes(transformedDishes);
      onUpdate(transformedDishes);
      setLoading(false);
    } catch (error) {
      console.error('Error in loadDishes:', error);
      setLoading(false);
    }
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setFormData(dish);
    setIsAddingNew(false);
    setImagePreview(dish.image_url || null);
  };

  const handleAddNew = () => {
    setEditingDish(null);
    setFormData({
      id: '',
      name: '',
      short_desc: '',
      full_desc: '',
      price: 0,
      category_id: categories[0]?.id || 'appetizers',
      currency: 'USD',
      image_url: '',
      available: true
    });
    setIsAddingNew(true);
    setImagePreview(null);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'menu-item');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const imageUrl = data.url;

      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      setImagePreview(imageUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) return;

    setSaving(true);
    try {
      const dishData = {
        id: formData.id || `dish-${Date.now()}`,
        name: formData.name,
        short_desc: formData.short_desc || '',
        full_desc: formData.full_desc || '',
        price: formData.price || 0,
        category_id: formData.category_id || 'appetizers',
        currency: formData.currency || 'USD',
        image_url: formData.image_url || '/images/placeholder.jpg',
        available: formData.available !== false
      };

      if (isAddingNew) {
        await apiFetch('/api/dishes', { method: 'POST', body: JSON.stringify(dishData) })
      } else {
        await apiFetch(`/api/dishes/${dishData.id}`, { method: 'PUT', body: JSON.stringify(dishData) })
      }

      console.log('✅ Dish saved successfully');
      await loadDishes();

      setEditingDish(null);
      setIsAddingNew(false);
      setFormData({});
      setImagePreview(null);
    } catch (error) {
      console.error('Error in handleSave:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dishId: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;

    try {
      await apiFetch(`/api/dishes/${dishId}`, { method: 'DELETE' })
      console.log('✅ Dish deleted successfully');
      await loadDishes();
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  };

  const handleCancel = () => {
    setEditingDish(null);
    setIsAddingNew(false);
    setFormData({});
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-staff-600"></div>
          <span className="ml-3 text-gray-600">Loading menu data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-1">
            {dishes.length} dishes • {dishes.filter(d => d.available).length} available
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-staff-600 hover:bg-staff-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Dish
        </button>
      </div>

      {/* Rest of the component remains the same... */}
      <div className="grid gap-4">
        {dishes.map((dish) => (
          <motion.div
            key={dish.id}
            layout
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={dish.image_url || '/images/placeholder.jpg'}
                  alt={dish.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{dish.name}</h3>
                  <p className="text-gray-600 text-sm">{dish.short_desc}</p>
                  <p className="text-staff-600 font-medium">${dish.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  dish.available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {dish.available ? 'Available' : 'Unavailable'}
                </span>
                <button
                  onClick={() => handleEdit(dish)}
                  className="p-2 text-gray-600 hover:text-staff-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(dish.id)}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {(editingDish || isAddingNew) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md m-4"
          >
            <h2 className="text-xl font-bold mb-4">
              {isAddingNew ? 'Add New Dish' : 'Edit Dish'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.short_desc || ''}
                  onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dish Image
                </label>
                
                {/* Current Image Preview */}
                {imagePreview && (
                  <div className="mb-3 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors">
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload Image</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  
                  {/* URL Input Alternative */}
                  <input
                    type="url"
                    placeholder="Or paste image URL"
                    value={formData.image_url || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available !== false}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                />
                <label htmlFor="available" className="text-sm font-medium text-gray-700">
                  Available
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-staff-600 hover:bg-staff-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
