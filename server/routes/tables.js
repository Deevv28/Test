const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for table image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'tables');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'table-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Middleware to ensure admin access
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// GET /api/tables - Get all tables for admin's restaurant
router.get('/', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        const tables = await db.all(`
            SELECT 
                rt.id, rt.table_number, rt.capacity, rt.status, rt.type, 
                rt.features, rt.x_position, rt.y_position, rt.created_at,
                rt.min_spend, rt.description,
                COUNT(ti.id) as image_count,
                ti.image_path as thumbnail_image
            FROM restaurant_tables rt
            LEFT JOIN table_images ti ON rt.id = ti.table_id AND ti.is_primary = 1
            WHERE rt.restaurant_id = ?
            GROUP BY rt.id
            ORDER BY rt.table_number
        `, [restaurantId]);

        res.status(200).json({
            success: true,
            message: 'Tables retrieved successfully',
            data: tables
        });

    } catch (error) {
        console.error('Get tables error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching tables'
        });
    }
});

// POST /api/tables - Create new table
router.post('/', [
    body('table_number').isInt({ min: 1 }).withMessage('Table number must be a positive integer'),
    body('capacity').isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
    body('type').isIn(['couple', 'family', 'group', 'private', 'outdoor']).withMessage('Invalid table type'),
    body('min_spend').isFloat({ min: 0 }).withMessage('Minimum spend must be a positive number'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('features').optional().isLength({ max: 200 }).withMessage('Features must be less than 200 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const restaurantId = req.user.restaurant_id;
        const { 
            table_number, 
            capacity, 
            type, 
            min_spend, 
            description, 
            features,
            x_position = 0,
            y_position = 0
        } = req.body;

        // Check if table number already exists
        const existingTable = await db.get(
            'SELECT id FROM restaurant_tables WHERE restaurant_id = ? AND table_number = ?',
            [restaurantId, table_number]
        );

        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: 'Table number already exists'
            });
        }

        const result = await db.run(`
            INSERT INTO restaurant_tables 
            (restaurant_id, table_number, capacity, type, status, features, x_position, y_position, min_spend, description)
            VALUES (?, ?, ?, ?, 'available', ?, ?, ?, ?, ?)
        `, [restaurantId, table_number, capacity, type, features || null, x_position, y_position, min_spend, description || null]);

        console.log(`✅ Table created: Table ${table_number} by Admin ${req.user.id}`);

        res.status(201).json({
            success: true,
            message: 'Table created successfully',
            data: {
                id: result.id,
                table_number,
                capacity,
                type,
                min_spend
            }
        });

    } catch (error) {
        console.error('Create table error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating table'
        });
    }
});

// PUT /api/tables/:id - Update table
router.put('/:id', [
    body('table_number').optional().isInt({ min: 1 }).withMessage('Table number must be a positive integer'),
    body('capacity').optional().isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
    body('type').optional().isIn(['couple', 'family', 'group', 'private', 'outdoor']).withMessage('Invalid table type'),
    body('min_spend').optional().isFloat({ min: 0 }).withMessage('Minimum spend must be a positive number'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('features').optional().isLength({ max: 200 }).withMessage('Features must be less than 200 characters'),
    body('status').optional().isIn(['available', 'reserved', 'occupied', 'cleaning']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Check if table exists and belongs to admin's restaurant
        const existingTable = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (!existingTable) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        const allowedFields = ['table_number', 'capacity', 'type', 'status', 'features', 'x_position', 'y_position', 'min_spend', 'description'];
        
        for (const field of allowedFields) {
            if (req.body.hasOwnProperty(field)) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        await db.run(
            `UPDATE restaurant_tables SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        console.log(`✅ Table updated: ID ${id} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Table updated successfully'
        });

    } catch (error) {
        console.error('Update table error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating table'
        });
    }
});

// DELETE /api/tables/:id - Delete table
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Check if table has any bookings
        const hasBookings = await db.get(
            'SELECT id FROM bookings WHERE table_id = ? AND status != "cancelled"',
            [id]
        );

        if (hasBookings) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete table with active bookings'
            });
        }

        // Delete table images first
        const tableImages = await db.all(
            'SELECT image_path FROM table_images WHERE table_id = ?',
            [id]
        );

        for (const image of tableImages) {
            const filePath = path.join(__dirname, '..', image.image_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.run('DELETE FROM table_images WHERE table_id = ?', [id]);

        const result = await db.run(
            'DELETE FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        console.log(`✅ Table deleted: ID ${id} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Table deleted successfully'
        });

    } catch (error) {
        console.error('Delete table error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting table'
        });
    }
});

// GET /api/tables/:id/images - Get table images
router.get('/:id/images', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Verify table belongs to admin's restaurant
        const table = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        const images = await db.all(`
            SELECT id, image_path, description, is_primary, created_at
            FROM table_images 
            WHERE table_id = ? AND is_active = 1
            ORDER BY is_primary DESC, created_at ASC
        `, [id]);

        res.status(200).json({
            success: true,
            message: 'Table images retrieved successfully',
            data: images
        });

    } catch (error) {
        console.error('Get table images error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching table images'
        });
    }
});

// POST /api/tables/:id/images - Upload table images
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image file is required'
            });
        }

        const { id } = req.params;
        const { descriptions = [] } = req.body;
        const restaurantId = req.user.restaurant_id;

        // Verify table belongs to admin's restaurant
        const table = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Check if this is the first image (will be primary)
        const existingImages = await db.get(
            'SELECT COUNT(*) as count FROM table_images WHERE table_id = ? AND is_active = 1',
            [id]
        );

        const isFirstImage = existingImages.count === 0;
        const uploadedImages = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const imagePath = `/uploads/tables/${file.filename}`;
            const description = Array.isArray(descriptions) ? descriptions[i] : descriptions;
            const isPrimary = isFirstImage && i === 0;

            const result = await db.run(`
                INSERT INTO table_images (table_id, image_path, description, is_primary)
                VALUES (?, ?, ?, ?)
            `, [id, imagePath, description || null, isPrimary ? 1 : 0]);

            uploadedImages.push({
                id: result.id,
                image_path: imagePath,
                description: description || null,
                is_primary: isPrimary
            });
        }

        console.log(`✅ Table images uploaded: ${req.files.length} images for Table ${id} by Admin ${req.user.id}`);

        res.status(201).json({
            success: true,
            message: 'Table images uploaded successfully',
            data: uploadedImages
        });

    } catch (error) {
        console.error('Upload table images error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while uploading images'
        });
    }
});

// PUT /api/tables/:tableId/images/:imageId/primary - Set image as primary
router.put('/:tableId/images/:imageId/primary', async (req, res) => {
    try {
        const { tableId, imageId } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Verify table belongs to admin's restaurant
        const table = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [tableId, restaurantId]
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Remove primary flag from all images for this table
        await db.run(
            'UPDATE table_images SET is_primary = 0 WHERE table_id = ?',
            [tableId]
        );

        // Set the selected image as primary
        const result = await db.run(
            'UPDATE table_images SET is_primary = 1 WHERE id = ? AND table_id = ?',
            [imageId, tableId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        console.log(`✅ Primary image updated: Image ${imageId} for Table ${tableId} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Primary image updated successfully'
        });

    } catch (error) {
        console.error('Update primary image error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating primary image'
        });
    }
});

// DELETE /api/tables/:tableId/images/:imageId - Delete table image
router.delete('/:tableId/images/:imageId', async (req, res) => {
    try {
        const { tableId, imageId } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Verify table belongs to admin's restaurant
        const table = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [tableId, restaurantId]
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Get image details
        const image = await db.get(
            'SELECT image_path, is_primary FROM table_images WHERE id = ? AND table_id = ?',
            [imageId, tableId]
        );

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Delete from database
        await db.run(
            'DELETE FROM table_images WHERE id = ? AND table_id = ?',
            [imageId, tableId]
        );

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', image.image_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // If this was the primary image, set another image as primary
        if (image.is_primary) {
            const nextImage = await db.get(
                'SELECT id FROM table_images WHERE table_id = ? AND is_active = 1 ORDER BY created_at ASC LIMIT 1',
                [tableId]
            );

            if (nextImage) {
                await db.run(
                    'UPDATE table_images SET is_primary = 1 WHERE id = ?',
                    [nextImage.id]
                );
            }
        }

        console.log(`✅ Table image deleted: Image ${imageId} for Table ${tableId} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Table image deleted successfully'
        });

    } catch (error) {
        console.error('Delete table image error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting image'
        });
    }
});

module.exports = router;