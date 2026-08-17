/**
 * Product Admin: Category-dependent Subcategory Filtering
 *
 * This script filters the Subcategory dropdown to show only subcategories
 * belonging to the selected Category.
 */

(function() {
    'use strict';

    // Wait for document to be ready
    document.addEventListener('DOMContentLoaded', function() {
        const categorySelect = document.getElementById('id_category');
        const subcategorySelect = document.getElementById('id_subcategory');

        if (!categorySelect || !subcategorySelect) {
            return; // Elements not found
        }

        // Store original options
        const originalOptions = Array.from(subcategorySelect.options);
        const optionsByCategory = {};

        // Group options by category
        originalOptions.forEach(function(option) {
            if (!option.value) {
                // Keep the empty option
                if (!optionsByCategory['']) {
                    optionsByCategory[''] = [];
                }
                optionsByCategory[''].push(option);
                return;
            }

            // Try to extract category from data attribute or match by pattern
            // The option's title might contain category info
            const dataCategory = option.getAttribute('data-category');
            const category = dataCategory || '';

            if (!optionsByCategory[category]) {
                optionsByCategory[category] = [];
            }
            optionsByCategory[category].push(option);
        });

        // Function to filter subcategories
        function filterSubcategories() {
            const selectedCategory = categorySelect.value;
            const currentSubcategory = subcategorySelect.value;

            // Clear current options
            subcategorySelect.innerHTML = '';

            // Always add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '---------';
            subcategorySelect.appendChild(emptyOption);

            // If no category selected, show empty
            if (!selectedCategory) {
                subcategorySelect.value = '';
                return;
            }

            // Fetch subcategories for selected category via AJAX
            fetch(`/admin/api/subcategories/?category=${selectedCategory}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // Add filtered options
                    data.subcategories.forEach(function(subcategory) {
                        const option = document.createElement('option');
                        option.value = subcategory.id;
                        option.textContent = subcategory.name;
                        subcategorySelect.appendChild(option);
                    });

                    // Try to restore previously selected subcategory if it's valid
                    if (currentSubcategory && Array.from(subcategorySelect.options).some(o => o.value === currentSubcategory)) {
                        subcategorySelect.value = currentSubcategory;
                    }
                })
                .catch(error => {
                    console.error('Error fetching subcategories:', error);
                    // Fallback: show all original options
                    originalOptions.forEach(function(option) {
                        if (option.value !== '') {
                            subcategorySelect.appendChild(option.cloneNode(true));
                        }
                    });
                });
        }

        // Listen for category changes
        categorySelect.addEventListener('change', filterSubcategories);

        // Initial filter on page load
        filterSubcategories();
    });
})();
