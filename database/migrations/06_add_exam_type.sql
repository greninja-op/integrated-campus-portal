-- Add exam_type column to study_materials table
ALTER TABLE study_materials 
ADD COLUMN exam_type ENUM('internal_1', 'internal_2', 'semester') NULL AFTER year;

-- Update existing records to have semester as default
UPDATE study_materials 
SET exam_type = 'semester' 
WHERE material_type = 'question_papers' AND exam_type IS NULL;
