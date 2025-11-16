const Category = require('../models/Category');

// Force reload of Category model to pick up changes
delete require.cache[require.resolve('../models/Category')];
const FreshCategory = require('../models/Category');
const path = require('path');

// File updated: 2025-11-15 19:05:00 - Force nodemon restart

class CategoryController {
  constructor(db) {
    this.categoryModel = new FreshCategory(db);
  }

  // Get all categories
  async getCategories(req, res) {
    try {
      const categories = await this.categoryModel.getAll();
      res.json(categories);
    } catch (error) {
      console.error('Error in getCategories:', error);
      res.status(500).json({ 
        error: 'Failed to fetch categories',
        message: error.message 
      });
    }
  }

  // Get category by ID
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await this.categoryModel.getById(id);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error in getCategoryById:', error);
      res.status(500).json({ 
        error: 'Failed to fetch category',
        message: error.message 
      });
    }
  }

  // Create new category
  async createCategory(req, res) {
    try {
      console.log('=== CREATE CATEGORY REQUEST ===');
      const { name } = req.body;
      
      console.log('Request body:', req.body);
      console.log('Uploaded file:', req.file);
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Category name is required' });
      }

      // Check if category name already exists
      const existingCategory = await this.categoryModel.nameExists(name.trim());
      if (existingCategory) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }

      let imageUrl = '';
      if (req.file) {
        imageUrl = `uploads/categories/${req.file.filename}`;
        console.log('Image uploaded and saved at:', imageUrl);
        console.log('Full file path:', req.file.path);
      } else {
        console.log('No image uploaded');
      }

      const categoryData = {
        name: name.trim(),
        image: imageUrl
      };

      // Double-check: ensure image is never null
      if (categoryData.image === null) {
        categoryData.image = '';
      }

      console.log('Category data to save:', categoryData);

      const category = await this.categoryModel.create(categoryData);
      
      console.log('Category created successfully:', category);
      console.log('=== END CREATE CATEGORY ===');
      
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ 
        error: 'Failed to create category',
        message: error.message 
      });
    }
  }

  // Update category
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Category name is required' });
      }

      // Check if category exists
      const existingCategory = await this.categoryModel.getById(id);
      if (!existingCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check if category name already exists (excluding current category)
      const nameExists = await this.categoryModel.nameExists(name.trim(), id);
      if (nameExists) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }

      let imageUrl = existingCategory.image;
      
      // Handle image upload
      if (req.file) {
        imageUrl = `uploads/categories/${req.file.filename}`;
      }

      const categoryData = {
        name: name.trim(),
        image: imageUrl || ''
      };

      // Double-check: ensure image is never null
      if (categoryData.image === null) {
        categoryData.image = '';
      }

      const category = await this.categoryModel.update(id, categoryData);
      
      res.json({
        message: 'Category updated successfully',
        category
      });
    } catch (error) {
      console.error('Error in updateCategory:', error);
      res.status(500).json({ 
        error: 'Failed to update category',
        message: error.message 
      });
    }
  }

  // Delete category
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      
      // Check if category exists
      const existingCategory = await this.categoryModel.getById(id);
      if (!existingCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check if category has products (optional - you might want to prevent deletion if products exist)
      // This would require checking the products table
      
      const deleted = await this.categoryModel.delete(id);
      
      if (!deleted) {
        return res.status(500).json({ error: 'Failed to delete category' });
      }
      
      res.json({
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      res.status(500).json({ 
        error: 'Failed to delete category',
        message: error.message 
      });
    }
  }
}

module.exports = CategoryController;
