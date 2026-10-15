import express from 'express';
import {
  listConceptMaps,
  getConceptMapById,
  createConceptMap,
  updateConceptMap,
  deleteConceptMap
} from '../controllers/conceptMapController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createConceptMapSchema,
  updateConceptMapSchema
} from '../validators/conceptMapValidator.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listConceptMaps);
router.get('/:id', getConceptMapById);
router.post('/', validate(createConceptMapSchema), createConceptMap);
router.put('/:id', validate(updateConceptMapSchema), updateConceptMap);
router.delete('/:id', deleteConceptMap);

export default router;
