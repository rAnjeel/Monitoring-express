const express = require('express');
const multer = require('multer');

const router = express.Router();
const deviceController = require('../controllers/device.controller');
const upload = multer({ dest: 'uploads/' });

router.get('/', deviceController.getAll.bind(deviceController));
router.get('/:id', deviceController.getById.bind(deviceController));
router.post('/', deviceController.create.bind(deviceController));
router.put('/:id', deviceController.update.bind(deviceController));
router.delete('/:id', deviceController.delete.bind(deviceController));
router.post('/import', upload.single('file'), deviceController.importCSV.bind(deviceController));

module.exports = router;
