/**
 * IMPORTANT: Real leaf-disease detection requires a trained computer-vision
 * model (e.g., a CNN trained on labeled leaf image datasets). That cannot be
 * trained inside this environment. This module is a clearly-labeled
 * placeholder that returns a deterministic, plausible-looking result derived
 * from the image filename/size so the feature is wired end-to-end (upload ->
 * store -> "detect" -> save report). Replace `analyzeImage` with a call to
 * a real ML inference API (e.g., a hosted PyTorch/TensorFlow model) when
 * available — the rest of the stack (routes, DB schema, frontend) will not
 * need to change.
 */

const KNOWLEDGE_BASE = [
  {
    diseaseName: 'Leaf Blight',
    cause: 'Fungal infection (Alternaria/Helminthosporium spp.) favored by warm, humid conditions.',
    symptoms: ['Brown/tan lesions with concentric rings', 'Yellowing around spots', 'Premature leaf drop'],
    prevention: ['Use disease-resistant varieties', 'Avoid overhead irrigation', 'Ensure proper field spacing for airflow'],
    treatment: 'Apply a recommended fungicide (e.g., Mancozeb 75% WP) at 2g/litre and remove infected leaves.',
  },
  {
    diseaseName: 'Powdery Mildew',
    cause: 'Fungal pathogen thriving in dry weather with high humidity at night.',
    symptoms: ['White powdery coating on leaf surface', 'Leaf curling', 'Stunted growth'],
    prevention: ['Avoid excess nitrogen fertilization', 'Improve air circulation', 'Remove and destroy infected plant debris'],
    treatment: 'Spray sulfur-based or systemic fungicide (e.g., Hexaconazole) as per label dosage.',
  },
  {
    diseaseName: 'Bacterial Leaf Spot',
    cause: 'Bacterial infection (Xanthomonas spp.), spread by water splash and contaminated tools.',
    symptoms: ['Small water-soaked spots turning brown/black', 'Yellow halo around spots', 'Leaf tearing'],
    prevention: ['Use certified disease-free seeds', 'Avoid working in wet fields', 'Practice crop rotation'],
    treatment: 'Apply copper-based bactericide and remove severely infected plants.',
  },
  {
    diseaseName: 'Healthy Leaf',
    cause: 'No pathogen detected.',
    symptoms: ['No visible lesions', 'Normal color and texture'],
    prevention: ['Continue regular monitoring', 'Maintain balanced fertilization and irrigation'],
    treatment: 'No treatment required.',
  },
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function analyzeImage(filename, fileSizeBytes) {
  const seed = hashString(filename) + Math.round(fileSizeBytes / 1024);
  const index = seed % KNOWLEDGE_BASE.length;
  const entry = KNOWLEDGE_BASE[index];
  const confidence = 70 + (seed % 26); // 70-95%

  return { ...entry, confidence };
}

module.exports = { analyzeImage };
