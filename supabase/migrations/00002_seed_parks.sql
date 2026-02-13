-- Seed parks with sample data (major US cities)
INSERT INTO parks (name, description, latitude, longitude, address, amenities, is_fenced, has_water, has_shade) VALUES
  ('Wiggly Field Dog Park', 'Large off-leash area with separate sections for small and large dogs', 41.9484, -87.6553, '2645 N Sheffield Ave, Chicago, IL', ARRAY['off-leash', 'separate areas', 'benches'], true, true, true),
  ('Montrose Dog Beach', 'Dog-friendly beach along Lake Michigan', 41.9639, -87.6388, '600 W Montrose Harbor Dr, Chicago, IL', ARRAY['beach', 'off-leash', 'swimming'], false, false, false),
  ('Central Bark Dog Park', 'Community dog park with agility equipment', 40.7829, -73.9654, '100 Central Park West, New York, NY', ARRAY['agility', 'off-leash', 'lighting'], true, true, true),
  ('Prospect Park Dog Beach', 'Off-leash area near the lake in Prospect Park', 40.6602, -73.9690, '171 East Dr, Brooklyn, NY', ARRAY['off-leash', 'lake access'], false, true, true),
  ('Runyon Canyon Dog Park', 'Scenic hiking trails with off-leash areas', 34.1063, -118.3498, '2000 N Fuller Ave, Los Angeles, CA', ARRAY['hiking', 'off-leash', 'scenic views'], false, false, false),
  ('Griffith Park Dog Park', 'Spacious dog park with mountain views', 34.1184, -118.3004, '4730 Crystal Springs Dr, Los Angeles, CA', ARRAY['off-leash', 'mountain views', 'parking'], true, true, true),
  ('Zilker Bark Park', 'Austin''s largest off-leash dog park', 30.2672, -97.7731, '2100 Barton Springs Rd, Austin, TX', ARRAY['off-leash', 'creek access', 'trails'], false, true, true),
  ('Auditorium Shores', 'Downtown dog park along Lady Bird Lake', 30.2620, -97.7509, '800 W Riverside Dr, Austin, TX', ARRAY['off-leash', 'lake access', 'downtown'], false, true, false),
  ('Gas Works Park Dog Area', 'Dog-friendly area with city skyline views', 47.6456, -122.3344, '2101 N Northlake Way, Seattle, WA', ARRAY['off-leash', 'skyline views'], false, false, true),
  ('Magnuson Park Off-Leash', 'Large off-leash area with lake access', 47.6810, -122.2570, '7400 Sand Point Way NE, Seattle, WA', ARRAY['off-leash', 'lake access', 'large area'], true, true, true),
  ('Piedmont Park Dog Park', 'Popular midtown dog park', 33.7879, -84.3733, '400 Park Dr NE, Atlanta, GA', ARRAY['off-leash', 'double-gated entry'], true, true, true),
  ('Freedom Park Dog Park', 'Neighborhood dog park along Freedom Trail', 33.7607, -84.3593, '750 North Ave NE, Atlanta, GA', ARRAY['off-leash', 'trail access'], true, false, true),
  ('Curtis Hixon Dog Park', 'Downtown waterfront dog park', 27.9506, -82.4613, '600 N Ashley Dr, Tampa, FL', ARRAY['off-leash', 'downtown', 'river views'], true, true, false),
  ('Davis Islands Dog Park', 'Waterfront dog park with beach access', 27.9231, -82.4507, '1002 Severn Ave, Tampa, FL', ARRAY['beach', 'off-leash', 'swimming'], false, true, false),
  ('Washington Park Dog Area', 'Historic park with off-leash hours', 39.7310, -104.9554, '701 S Franklin St, Denver, CO', ARRAY['off-leash hours', 'historic'], false, true, true);
