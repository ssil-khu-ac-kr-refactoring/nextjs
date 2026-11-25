BEGIN;

INSERT INTO "HomePageContent" (
  "id", "heroTitle", "heroSubtitle", "heroParagraph", "aboutTitle", "aboutParagraph",
  "newsTitle", "newsSubtitle", "fontFamily"
) VALUES (
  1, 'SSIL', 'Space Science Instrument Laboratory', '',
  'From Space Instruments to Scientific Insight',
  'SSIL develops space science instruments and data analysis technologies for observing and understanding space environments, from near-Earth space to the lunar surface.',
  'News', 'Laboratory updates', 'MaruBuri'
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "SliderImage" ("id", "imageUrl", "order")
VALUES (1, 'https://ssil.khu.ac.kr/api/files/slider-1787708588297-_______1___.png', 0)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Research" (
  "id", "title", "description", "status", "startDate", "published", "order", "imageUrl", "updatedAt"
) VALUES
  ('preview-neutron', 'Neutron Detector', 'Neutron Detector Development for Planetary Exploration',
    'IN_PROGRESS', '2025-09-01', true, 0, 'https://ssil.khu.ac.kr/api/files/1787883065282-ChatGPT_Image_2026__8__28_____11_10_08.png', CURRENT_TIMESTAMP),
  ('preview-charging', 'Satellite Surface Charging', 'Simulation-Based LEO Spacecraft Charging Risk Assessment',
    'IN_PROGRESS', '2023-01-01', true, 1, 'https://ssil.khu.ac.kr/api/files/1788239309474-_____126_.png', CURRENT_TIMESTAMP),
  ('preview-shielding', 'Radiation Shielding Evaluation', 'Radiation exposure and shielding for satellite quantum communication payloads',
    'IN_PROGRESS', '2022-11-01', true, 2, 'https://ssil.khu.ac.kr/api/files/1787707831461-QKD_Thumbnail.png', CURRENT_TIMESTAMP),
  ('preview-lusem', 'LUSEM', 'Energetic Particle Measurement and Detector Development for Lunar Surface Exploration',
    'IN_PROGRESS', '2020-05-01', true, 3, 'https://ssil.khu.ac.kr/api/files/1787708404410-IM-3_MoonScape_logo.jpg', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

COMMIT;
