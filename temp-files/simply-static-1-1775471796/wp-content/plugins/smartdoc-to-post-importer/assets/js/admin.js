/**
 * SmartDoc to Post Importer - Admin JavaScript
 *
 * @package SmartDocToPostImporter
 */

(function($) {
    'use strict';
    
    // Initialize when document is ready
    $(document).ready(function() {
        SmartdocpostAdmin.init();
    });
    
    /**
     * Main admin object
     */
    var SmartdocpostAdmin = {
        
        /**
         * Initialize admin functionality
         */
        init: function() {
            this.bindEvents();
            this.initFileUpload();
            this.initFormValidation();
            
            // Load taxonomies for default post type on page load
            if ($('#post_type').length && $('#taxonomy_container').length) {
                this.handlePostTypeChange();
            }
        },
        
        /**
         * Bind event handlers
         */
        bindEvents: function() {
            // File upload form submission
            $('.smartdocpost-upload-form').on('submit', this.handleFileUpload.bind(this));
        
        // Handle import form submission
        $('.smartdocpost-import-form').on('submit', this.handleImport.bind(this));
            
            // File input change
            $('input[name="word_file"]').on('change', this.handleFileSelect.bind(this));
            
            // Form field changes
            $('#post_title').on('input', this.updateMetaTitle.bind(this));
            $('#post_type').on('change', this.handlePostTypeChange.bind(this));
            
            // File validation on selection
            $('input[name="word_file"]').on('change', this.validateFileUpload.bind(this));
        },
        
        /**
         * Initialize file upload functionality
         */
        initFileUpload: function() {
            var $fileInput = $('input[name="word_file"]');
            var $uploadArea = $fileInput.closest('.form-table');
            
            // Add drag and drop functionality
            $uploadArea.on('dragover dragenter', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).addClass('smartdocpost-drag-over');
            });
            
            $uploadArea.on('dragleave dragend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('smartdocpost-drag-over');
            });
            
            $uploadArea.on('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('smartdocpost-drag-over');
                
                var files = e.originalEvent.dataTransfer.files;
                if (files.length > 0) {
                    $fileInput[0].files = files;
                    SmartdocpostAdmin.handleFileSelect();
                }
            });
        },
        
        /**
         * Initialize form validation
         */
        initFormValidation: function() {
            // Real-time validation for required fields
            $('input[required], select[required], textarea[required]').on('blur', function() {
                SmartdocpostAdmin.validateField($(this));
            });
        },
        
        /**
         * Handle file upload form submission
         */
        handleFileUpload: function(e) {
            e.preventDefault(); // Prevent default form submission
            
            var $form = $(e.target);
            var $fileInput = $form.find('input[name="word_file"]');
            var $submitButton = $form.find('input[type="submit"]');
            
            // Validate file selection
            if (!$fileInput[0].files.length) {
                this.showNotice('Error: Please select a file.', 'error');
                return false;
            }
            
            // Validate file type
            var file = $fileInput[0].files[0];
            if (!this.validateFileType(file)) {
                return false;
            }
            
            // Show loading state
            $submitButton.prop('disabled', true).val('Uploading...');
            $form.addClass('smartdocpost-loading');
            
            // Show progress bar
            this.showProgressBar($form);
            
            // Prepare form data for AJAX
            var formData = new FormData();
            formData.append('action', 'smartdocpost_upload_file');
        formData.append('file', file);
        formData.append('smartdocpost_nonce', document.querySelector('input[name="smartdocpost_nonce"]').value);
            
            // Send AJAX request
            $.ajax({
                url: smartdocpost_ajax.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    SmartdocpostAdmin.handleUploadSuccess(response, $form);
                },
                error: function(xhr, status, error) {
                    SmartdocpostAdmin.handleUploadError(error, $form);
                }
            });
        },
        
        /**
         * Handle import form submission
         */
        handleImport: function(e) {
            e.preventDefault(); // Prevent default form submission
            
            var $form = $(e.target);
            var $submitButton = $form.find('input[type="submit"]');
            
            console.log('Form submission started');
            console.log('Form element:', $form[0]);
            console.log('Form ID:', $form.attr('id'));
            console.log('Form class:', $form.attr('class'));
            
            // Validate required fields
            var isValid = true;
            $form.find('input[required], select[required]').each(function() {
                if (!SmartdocpostAdmin.validateField($(this))) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                console.log('Form validation failed');
                return false;
            }
            
            // Show loading state
            $submitButton.prop('disabled', true).val('Processing...');
            $form.addClass('smartdocpost-loading');
            
            // Debug: Log all form elements
            console.log('Form elements:');
            $form.find('input, select, textarea').each(function() {
                var $el = $(this);
                console.log($el.attr('name') + ': ' + $el.val() + ' (type: ' + $el.attr('type') + ', id: ' + $el.attr('id') + ')');
            });
            
            // Prepare form data for AJAX
            var formData = $form.serialize();
            console.log('Serialized form data:', formData);
            
            formData += '&action=smartdocpost_import_content&smartdocpost_nonce=' + $form.find('input[name="smartdocpost_import_nonce"]').val();
            
            // Always include featured_image_id in form data, even if it's empty
            var featuredImageId = $('#featured_image_id').val();
            console.log('Featured Image ID:', featuredImageId);
            console.log('Featured Image ID element:', $('#featured_image_id')[0]);
            
            // Always add featured_image_id to form data, even if empty
            formData += '&featured_image_id=' + (featuredImageId || '0');
            console.log('Added featured_image_id to form data:', featuredImageId || '0');
            
            // Debug: Log the complete form data
            console.log('Final form data:', formData);
            
            // Send AJAX request
            console.log('Sending AJAX request to:', smartdocpost_ajax.ajax_url);
            $.ajax({
                url: smartdocpost_ajax.ajax_url,
                type: 'POST',
                data: formData,
                success: function(response) {
                    console.log('AJAX success response:', response);
                    SmartdocpostAdmin.handleImportSuccess(response, $form);
                },
                error: function(xhr, status, error) {
                    console.log('AJAX error:', status, error);
                    console.log('Response text:', xhr.responseText);
                    SmartdocpostAdmin.handleImportError(error, $form);
                }
            });
        },
        
        /**
         * Handle file selection
         */
        handleFileSelect: function() {
            var $fileInput = $('input[name="word_file"]');
            var file = $fileInput[0].files[0];
            
            if (file) {
                // Validate file
                if (this.validateFileType(file)) {
                    this.showFileInfo(file);
                } else {
                    $fileInput.val('');
                }
            }
        },
        
        /**
         * Validate file type and size
         */
        validateFileType: function(file) {
            var allowedTypes = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword'
            ];
            
            var allowedExtensions = ['doc', 'docx'];
            var fileExtension = file.name.split('.').pop().toLowerCase();
            
            // Check file type
            if (allowedTypes.indexOf(file.type) === -1 && allowedExtensions.indexOf(fileExtension) === -1) {
                this.showNotice('Invalid file type. Please select a .doc or .docx file.', 'error');
                return false;
            }
            
            // Check file size (10MB max)
            var maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                this.showNotice('File size exceeds 10MB limit.', 'error');
                return false;
            }
            
            return true;
        },
        
        /**
         * Show file information
         */
        showFileInfo: function(file) {
            var fileSize = this.formatFileSize(file.size);
            var fileName = file.name;
            
            var $info = $('<div class="smartdocpost-file-info">');
            $info.html(
                '<strong>Selected file:</strong> ' + fileName + ' (' + fileSize + ')'
            );
            
            // Remove existing info
            $('.smartdocpost-file-info').remove();
            
            // Add new info
            $('input[name="word_file"]').after($info);
        },
        
        /**
         * Update meta title when post title changes
         */
        updateMetaTitle: function() {
            var postTitle = $('#post_title').val();
            var $metaTitle = $('#meta_title');
            
            if ($metaTitle.val() === '' || $metaTitle.data('auto-filled')) {
                $metaTitle.val(postTitle).data('auto-filled', true);
            }
        },
        
        /**
         * Handle post type change
         */
        handlePostTypeChange: function() {
            var postType = $('#post_type').val();
            var $taxonomyContainer = $('#taxonomy_container');
            
            // Show loading state
            $taxonomyContainer.html('<p>Loading taxonomies...</p>');
            
            // Load taxonomies via AJAX
            if (typeof smartdocpost_ajax !== 'undefined') {
                $.ajax({
                    url: smartdocpost_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'smartdocpost_get_taxonomies',
                        post_type: postType,
                        nonce: smartdocpost_ajax.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            SmartdocpostAdmin.renderTaxonomyFields(response.data);
                        } else {
                            $taxonomyContainer.html('<p>No taxonomies available for this post type.</p>');
                        }
                    },
                    error: function() {
                        $taxonomyContainer.html('<p>Error loading taxonomies. Please try again.</p>');
                    }
                });
            }
        },
        
        /**
         * Render taxonomy fields from AJAX response
         */
        renderTaxonomyFields: function(taxonomies) {
            var $container = $('#taxonomy_container');
            var html = '';
            
            if (Object.keys(taxonomies).length === 0) {
                html = '<p>No taxonomies available for this post type.</p>';
            } else {
                $.each(taxonomies, function(taxonomyName, taxonomy) {
                    html += '<div class="taxonomy-field" data-taxonomy="' + taxonomyName + '">';
                    html += '<label for="tax_' + taxonomyName + '">' + taxonomy.label + '</label><br>';
                    html += '<select name="taxonomies[' + taxonomyName + '][]" id="tax_' + taxonomyName + '" multiple style="width: 100%; min-height: 80px;">';
                    
                    $.each(taxonomy.terms, function(index, term) {
                        html += '<option value="' + term.id + '">' + term.name + '</option>';
                    });
                    
                    html += '</select>';
                    html += '<p class="description">Hold Ctrl/Cmd to select multiple ' + taxonomy.label.toLowerCase() + '</p>';
                    html += '</div><br>';
                });
            }
            
            $container.html(html);
        },
        
        /**
         * Validate file upload
         */
        validateFileUpload: function() {
            var $fileInput = $('input[name="word_file"]');
            var files = $fileInput[0].files;
            
            if (files.length > 0) {
                var file = files[0];
                
                // Validate file type and size
                if (this.validateFileType(file)) {
                    this.showFileInfo(file);
                    
                    // Enable submit button
                    $('.smartdocpost-upload-form input[type="submit"]').prop('disabled', false);
                    
                    // Show success message
                    this.showNotice('File selected successfully. Click "Upload & Generate Preview" to continue.', 'success');
                } else {
                    // Clear file input
                    $fileInput.val('');
                    
                    // Disable submit button
                    $('.smartdocpost-upload-form input[type="submit"]').prop('disabled', true);
                    
                    // Remove file info
                    $('.smartdocpost-file-info').remove();
                }
            }
        },
        
        /**
         * Validate individual field
         */
        validateField: function($field) {
            var value = $field.val().trim();
            var isValid = true;
            
            // Remove existing validation messages
            $field.next('.smartdocpost-validation-message').remove();
        $field.removeClass('smartdocpost-invalid');
            
            // Check required fields
            if ($field.prop('required') && value === '') {
                this.showFieldError($field, 'This field is required.');
                isValid = false;
            }
            
            // Validate email fields
            if ($field.attr('type') === 'email' && value !== '') {
                var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    this.showFieldError($field, 'Please enter a valid email address.');
                    isValid = false;
                }
            }
            
            // Validate URL fields
            if ($field.attr('type') === 'url' && value !== '') {
                var urlRegex = /^https?:\/\/.+/;
                if (!urlRegex.test(value)) {
                    this.showFieldError($field, 'Please enter a valid URL.');
                    isValid = false;
                }
            }
            
            return isValid;
        },
        
        /**
         * Show field validation error
         */
        showFieldError: function($field, message) {
            $field.addClass('smartdocpost-invalid');
        var $error = $('<span class="smartdocpost-validation-message">' + message + '</span>');
            $field.after($error);
        },
        
        /**
         * Show progress bar
         */
        showProgressBar: function($container) {
            var $progress = $('<div class="smartdocpost-progress"><div class="smartdocpost-progress-bar"></div></div>');
            $container.append($progress);
            
            // Animate progress
            var progress = 0;
            var interval = setInterval(function() {
                progress += Math.random() * 15;
                if (progress > 90) {
                    progress = 90;
                    clearInterval(interval);
                }
                $progress.find('.smartdocpost-progress-bar').css('width', progress + '%');
            }, 200);
        },
        
        /**
         * Show admin notice
         */
        showNotice: function(message, type) {
            type = type || 'info';
            
            var $notice = $('<div class="notice notice-' + type + ' is-dismissible smartdocpost-notice">');
            $notice.html('<p>' + message + '</p>');
            
            // Add dismiss button
            $notice.append('<button type="button" class="notice-dismiss"><span class="screen-reader-text">Dismiss this notice.</span></button>');
            
            // Insert notice
            $('.wrap h1').after($notice);
            
            // Handle dismiss
            $notice.find('.notice-dismiss').on('click', function() {
                $notice.fadeOut(300, function() {
                    $(this).remove();
                });
            });
            
            // Auto-dismiss after 5 seconds for non-error notices
            if (type !== 'error') {
                setTimeout(function() {
                    $notice.find('.notice-dismiss').click();
                }, 5000);
            }
        },
        
        /**
         * Format file size
         */
        formatFileSize: function(bytes) {
            var units = ['B', 'KB', 'MB', 'GB'];
            var i = 0;
            
            while (bytes >= 1024 && i < units.length - 1) {
                bytes /= 1024;
                i++;
            }
            
            return Math.round(bytes * 100) / 100 + ' ' + units[i];
        },
        
        /**
         * Handle upload success
         */
        handleUploadSuccess: function(response, $form) {
            var $submitButton = $form.find('input[type="submit"]');
            
            // Reset form state
            $submitButton.prop('disabled', false).val('Upload & Generate Preview');
            $form.removeClass('smartdocpost-loading');
            $('.smartdocpost-progress').remove();
            
            if (response.success) {
                // Show success message
                this.showNotice(response.data.message, 'success');
                
                // Display preview content
                if (response.data.preview_html) {
                    // Remove any existing preview
                    $('.smartdocpost-preview-section').remove();
                    
                    // Add new preview content
                    $('.smartdocpost-admin-container').after(response.data.preview_html);
                    
                    // Show preview with animation
                    $('.smartdocpost-preview-section').addClass('show');
                    
                    // Bind import form events
                    this.bindImportForm();
                    
                    // Scroll to preview
                    this.scrollTo('.smartdocpost-preview-section');
                }
                
                // Reset form
                $('.smartdocpost-upload-form')[0].reset();
            } else {
                this.showNotice(response.data.message || 'Upload failed', 'error');
            }
        },
        
        /**
         * Handle upload error
         */
        handleUploadError: function(error, $form) {
            var $submitButton = $form.find('input[type="submit"]');
            
            // Reset form state
            $submitButton.prop('disabled', false).val('Upload & Generate Preview');
            $form.removeClass('smartdocpost-loading');
            $('.smartdocpost-progress').remove();
            
            this.showNotice('Upload failed: ' + error, 'error');
        },
        
        /**
         * Handle import success
         */
        handleImportSuccess: function(response, $form) {
            var $submitButton = $form.find('input[type="submit"]');
            
            // Reset form state
            $submitButton.prop('disabled', false).val('Import to WordPress');
            $form.removeClass('smartdocpost-loading');
            
            if (response.success) {
                // Show success message with links
                this.showNotice(response.data.message, 'success');
                
                // Hide the preview section
                $('.smartdocpost-preview-section').fadeOut();
                
                // Reset upload form
                $('.smartdocpost-upload-form')[0].reset();
                
                // Optionally redirect to edit post
                if (response.data.edit_url) {
                    setTimeout(function() {
                        window.location.href = response.data.edit_url;
                    }, 3000);
                }
            } else {
                this.showNotice(response.data.message || 'Import failed', 'error');
            }
        },
        
        /**
         * Handle import error
         */
        handleImportError: function(error, $form) {
            var $submitButton = $form.find('input[type="submit"]');
            
            // Reset form state
            $submitButton.prop('disabled', false).val('Import to WordPress');
            $form.removeClass('smartdocpost-loading');
            
            this.showNotice('Import failed: ' + error, 'error');
        },
        
        /**
         * Bind import form events
         */
        bindImportForm: function() {
            var self = this;
            
            // Bind import form submission
            $(document).off('submit', '.smartdocpost-import-form').on('submit', '.smartdocpost-import-form', function(e) {
                self.handleImport(e);
            });
            
            // Bind form field changes
            $(document).off('change', '.smartdocpost-import-form input, .smartdocpost-import-form select, .smartdocpost-import-form textarea')
            .on('change', '.smartdocpost-import-form input, .smartdocpost-import-form select, .smartdocpost-import-form textarea', function() {
                self.validateField($(this));
            });
            
            // Bind post type change
            $(document).off('change', '#post_type').on('change', '#post_type', function() {
                self.handlePostTypeChange($(this).val());
            });
            
            // Update meta title when post title changes
            $(document).off('input', '#post_title').on('input', '#post_title', function() {
                self.updateMetaTitle($(this).val());
            });
            
            // Initialize featured image uploader
            this.initFeaturedImageUploader();
            
            // Automatically load taxonomies for the default post type
            if ($('#post_type').length) {
                this.handlePostTypeChange($('#post_type').val());
            }
        },
        
        /**
         * Initialize featured image uploader
         */
        initFeaturedImageUploader: function() {
            var self = this;
            
            // Initialize WordPress media uploader
            $('.upload-featured-image').off('click').on('click', function(e) {
                e.preventDefault();
                
                var $previewContainer = $('.featured-image-preview');
                var $imageIdField = $('#featured_image_id');
                var $uploadButton = $('.upload-featured-image');
                var $removeButton = $('.remove-featured-image');
                
                // Create a media frame
                var frame = wp.media({
                    title: 'Select or Upload Featured Image',
                    button: {
                        text: 'Use this image'
                    },
                    multiple: false
                });
                
                // When an image is selected in the media frame
                frame.on('select', function() {
                    // Get media attachment details
                    var attachment = frame.state().get('selection').first().toJSON();
                    
                    // Set the image ID to the hidden input
                    $imageIdField.val(attachment.id);
                    console.log('Image selected, ID set to:', attachment.id);
                    console.log('Image ID field value after setting:', $imageIdField.val());
                    console.log('Image ID field element:', $imageIdField[0]);
                    
                    // Display the image preview
                    $previewContainer.html('<img src="' + attachment.url + '" alt="Featured Image" style="max-width:100%;max-height:150px;">');
                    
                    // Show remove button and hide upload button
                    $uploadButton.hide();
                    $removeButton.show();
                });
                
                // Open the media frame
                frame.open();
            });
            
            // Handle remove image button
            $('.remove-featured-image').off('click').on('click', function(e) {
                e.preventDefault();
                
                var $previewContainer = $('.featured-image-preview');
                var $imageIdField = $('#featured_image_id');
                var $uploadButton = $('.upload-featured-image');
                var $removeButton = $('.remove-featured-image');
                
                // Clear the image ID
                $imageIdField.val('');
                console.log('Image removed, ID cleared');
                console.log('Image ID field value after clearing:', $imageIdField.val());
                console.log('Image ID field element after clearing:', $imageIdField[0]);
                
                // Clear the preview
                $previewContainer.empty();
                
                // Show upload button and hide remove button
                $uploadButton.show();
                $removeButton.hide();
            });
        },
        
        /**
         * Scroll to element
         */
        scrollTo: function($element, offset) {
            offset = offset || 0;
            
            if (typeof $element === 'string') {
                $element = $($element);
            }
            
            if ($element.length) {
                $('html, body').animate({
                    scrollTop: $element.offset().top - offset
                }, 500);
            }
        }
    };
    
    // Make SmartdocpostAdmin globally available
     window.SmartdocpostAdmin = SmartdocpostAdmin;
    
})(jQuery);

/**
 * Additional utility functions
 */

// Debounce function for performance
function smartdocpostDebounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Throttle function for performance
function smartdocpostThrottle(func, limit) {
    var inThrottle;
    return function() {
        var args = arguments;
        var context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(function() {
                inThrottle = false;
            }, limit);
        }
    };
}
