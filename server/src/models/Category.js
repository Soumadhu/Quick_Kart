class Category {
  constructor(db) {
    this.db = db;
  }

  // Get all categories
  async getAll() {
    try {
      const categories = await this.db('categories')
        .select('*')
        .orderBy('created_at', 'desc');
      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Get category by ID
  async getById(id) {
    try {
      const category = await this.db('categories')
        .where('id', id)
        .first();
      return category;
    } catch (error) {
      console.error('Error getting category by ID:', error);
      throw error;
    }
  }

  // Create new category
  async create(categoryData) {
    try {
      const [category] = await this.db('categories')
        .insert({
          name: categoryData.name,
          image: categoryData.image || '',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      return category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Update category
  async update(id, categoryData) {
    try {
      const [category] = await this.db('categories')
        .where('id', id)
        .update({
          name: categoryData.name,
          image: categoryData.image || '',
          updated_at: new Date()
        })
        .returning('*');
      return category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete category
  async delete(id) {
    try {
      const deleted = await this.db('categories')
        .where('id', id)
        .del();
      return deleted > 0;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Check if category name exists
  async nameExists(name, excludeId = null) {
    try {
      let query = this.db('categories').where('name', name);
      
      if (excludeId) {
        query = query.whereNot('id', excludeId);
      }
      
      const category = await query.first();
      return !!category;
    } catch (error) {
      console.error('Error checking category name existence:', error);
      throw error;
    }
  }
}

module.exports = Category;
