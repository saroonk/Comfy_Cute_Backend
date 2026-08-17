/**
 * Category → Subcategory Dependent Dropdown Filter
 *
 * Filters the Subcategory dropdown to show only subcategories
 * belonging to the selected Category in the Product admin.
 *
 * This script automatically detects category changes and filters
 * the subcategory options dynamically.
 */

(function() {
    'use strict';

    /**
     * Initialize the dependent dropdown on page load
     */
    function initializeDependentDropdown() {
        const categorySelect = document.getElementById('id_category');
        const subcategorySelect = document.getElementById('id_subcategory');

        // Exit if elements not found
        if (!categorySelect || !subcategorySelect) {
            console.warn('Category or Subcategory field not found in Product admin');
            return;
        }

        // Store all original subcategory options
        const originalOptions = Array.from(subcategorySelect.options).map(opt => ({
            value: opt.value,
            text: opt.textContent,
            element: opt
        }));

        /**
         * Fetch subcategories for the selected category
         */
        function fetchSubcategoriesForCategory(categoryId) {
            if (!categoryId) {
                // No category selected, show empty with placeholder
                updateSubcategoryDropdown([]);
                return;
            }

            // Construct API URL
            const apiUrl = '/api/product-subcategories/?category_id=' + encodeURIComponent(categoryId);

            fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('API response was not ok: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (data.subcategories && Array.isArray(data.subcategories)) {
                    updateSubcategoryDropdown(data.subcategories);
                } else {
                    console.warn('Unexpected API response format:', data);
                    updateSubcategoryDropdown([]);
                }
            })
            .catch(error => {
                console.error('Error fetching subcategories:', error);
                // Fallback: show all original subcategories
                updateSubcategoryDropdown(
                    originalOptions
                        .filter(opt => opt.value !== '')
                        .map(opt => ({ id: opt.value, name: opt.text }))
                );
            });
        }

        /**
         * Update subcategory dropdown with provided options
         *
         * @param {Array} subcategories - Array of objects with id and name properties
         */
        function updateSubcategoryDropdown(subcategories) {
            const currentValue = subcategorySelect.value;

            // Remove all options except the first (placeholder/empty option)
            while (subcategorySelect.options.length > 1) {
                subcategorySelect.remove(1);
            }

            // Add new options
            subcategories.forEach(function(subcat) {
                const option = document.createElement('option');
                option.value = subcat.id;
                option.textContent = subcat.name;
                subcategorySelect.appendChild(option);
            });

            // Attempt to restore the previous selection if it still exists
            if (currentValue) {
                const optionExists = Array.from(subcategorySelect.options).some(
                    opt => opt.value === currentValue
                );
                if (optionExists) {
                    subcategorySelect.value = currentValue;
                } else {
                    // Previous selection is not valid for new category
                    subcategorySelect.value = '';
                }
            } else {
                subcategorySelect.value = '';
            }

            // Dispatch change event in case other scripts are listening
            subcategorySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        /**
         * Handle category selection change
         */
        function handleCategoryChange() {
            const selectedCategoryId = categorySelect.value;
            fetchSubcategoriesForCategory(selectedCategoryId);
        }

        // Attach event listener for category changes
        categorySelect.addEventListener('change', handleCategoryChange);

        // Initial setup: fetch subcategories for currently selected category
        const initialCategoryId = categorySelect.value;
        if (initialCategoryId) {
            // Category is already selected, fetch its subcategories
            setTimeout(function() {
                fetchSubcategoriesForCategory(initialCategoryId);
            }, 100);
        }
    }

    /**
     * Wait for document to be ready, then initialize
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDependentDropdown);
    } else {
        // Document is already ready
        initializeDependentDropdown();
    }
})();
