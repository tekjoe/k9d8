/**
 * US States data for BringFido scraping
 */

const US_STATES = [
  { name: 'Alabama', abbreviation: 'AL', slug: 'alabama', completed: true },
  { name: 'Alaska', abbreviation: 'AK', slug: 'alaska', completed: true },
  { name: 'Arizona', abbreviation: 'AZ', slug: 'arizona', completed: true },
  { name: 'Arkansas', abbreviation: 'AR', slug: 'arkansas', completed: true },
  { name: 'California', abbreviation: 'CA', slug: 'california', completed: true },
  { name: 'Colorado', abbreviation: 'CO', slug: 'colorado', completed: true },
  { name: 'Connecticut', abbreviation: 'CT', slug: 'connecticut', completed: true },
  { name: 'Delaware', abbreviation: 'DE', slug: 'delaware', completed: true },
  { name: 'Florida', abbreviation: 'FL', slug: 'florida', completed: true },
  { name: 'Georgia', abbreviation: 'GA', slug: 'georgia', completed: true },
  { name: 'Hawaii', abbreviation: 'HI', slug: 'hawaii', completed: true },
  { name: 'Idaho', abbreviation: 'ID', slug: 'idaho', completed: true },
  { name: 'Illinois', abbreviation: 'IL', slug: 'illinois', completed: true },
  { name: 'Indiana', abbreviation: 'IN', slug: 'indiana', completed: true },
  { name: 'Iowa', abbreviation: 'IA', slug: 'iowa', completed: true },
  { name: 'Kansas', abbreviation: 'KS', slug: 'kansas', completed: true },
  { name: 'Kentucky', abbreviation: 'KY', slug: 'kentucky', completed: true },
  { name: 'Louisiana', abbreviation: 'LA', slug: 'louisiana', completed: true },
  { name: 'Maine', abbreviation: 'ME', slug: 'maine', completed: true },
  { name: 'Maryland', abbreviation: 'MD', slug: 'maryland', completed: true },
  { name: 'Massachusetts', abbreviation: 'MA', slug: 'massachusetts', completed: true },
  { name: 'Michigan', abbreviation: 'MI', slug: 'michigan', completed: true },
  { name: 'Minnesota', abbreviation: 'MN', slug: 'minnesota', completed: true },
  { name: 'Mississippi', abbreviation: 'MS', slug: 'mississippi', completed: true },
  { name: 'Missouri', abbreviation: 'MO', slug: 'missouri', completed: true },
  { name: 'Montana', abbreviation: 'MT', slug: 'montana', completed: true },
  { name: 'Nebraska', abbreviation: 'NE', slug: 'nebraska', completed: true },
  { name: 'Nevada', abbreviation: 'NV', slug: 'nevada', completed: true },
  { name: 'New Hampshire', abbreviation: 'NH', slug: 'new-hampshire', completed: true },
  { name: 'New Jersey', abbreviation: 'NJ', slug: 'new-jersey', completed: true },
  { name: 'New Mexico', abbreviation: 'NM', slug: 'new-mexico', completed: true },
  { name: 'New York', abbreviation: 'NY', slug: 'new-york', completed: true },
  { name: 'North Carolina', abbreviation: 'NC', slug: 'north-carolina', completed: true },
  { name: 'North Dakota', abbreviation: 'ND', slug: 'north-dakota', completed: true },
  { name: 'Ohio', abbreviation: 'OH', slug: 'ohio', completed: true },
  { name: 'Oklahoma', abbreviation: 'OK', slug: 'oklahoma', completed: true },
  { name: 'Oregon', abbreviation: 'OR', slug: 'oregon', completed: true },
  { name: 'Pennsylvania', abbreviation: 'PA', slug: 'pennsylvania', completed: true },
  { name: 'Rhode Island', abbreviation: 'RI', slug: 'rhode-island', completed: true },
  { name: 'South Carolina', abbreviation: 'SC', slug: 'south-carolina', completed: true },
  { name: 'South Dakota', abbreviation: 'SD', slug: 'south-dakota', completed: true },
  { name: 'Tennessee', abbreviation: 'TN', slug: 'tennessee', completed: true },
  { name: 'Texas', abbreviation: 'TX', slug: 'texas', completed: true },
  { name: 'Utah', abbreviation: 'UT', slug: 'utah', completed: true },
  { name: 'Vermont', abbreviation: 'VT', slug: 'vermont', completed: true },
  { name: 'Virginia', abbreviation: 'VA', slug: 'virginia', completed: true },
  { name: 'Washington', abbreviation: 'WA', slug: 'washington', completed: true },
  { name: 'West Virginia', abbreviation: 'WV', slug: 'west-virginia', completed: true },
  { name: 'Wisconsin', abbreviation: 'WI', slug: 'wisconsin', completed: true },
  { name: 'Wyoming', abbreviation: 'WY', slug: 'wyoming', completed: true },
];

const COMPLETED_STATES = US_STATES.filter(s => s.completed);
const PENDING_STATES = US_STATES.filter(s => !s.completed);

function getBringFidoUrl(stateSlug, page = 1) {
  const baseUrl = `https://www.bringfido.com/attraction/parks/state/${stateSlug}/`;
  return page > 1 ? `${baseUrl}?page=${page}` : baseUrl;
}

module.exports = {
  US_STATES,
  COMPLETED_STATES,
  PENDING_STATES,
  getBringFidoUrl,
};
