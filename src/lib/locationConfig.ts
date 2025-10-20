// Configuration centralisée des départements et villes d'Haïti
export interface DepartmentConfig {
  value: string;
  label: string;
  cities: CityConfig[];
}

export interface CityConfig {
  value: string;
  label: string;
}

// Configuration des départements et leurs villes principales
export const DEPARTMENTS: DepartmentConfig[] = [
  {
    value: "Ouest",
    label: "Ouest",
    cities: [
      { value: "Port-au-Prince", label: "Port-au-Prince" },
      { value: "Carrefour", label: "Carrefour" },
      { value: "Delmas", label: "Delmas" },
      { value: "Pétion-Ville", label: "Pétion-Ville" },
      { value: "Cité Soleil", label: "Cité Soleil" },
      { value: "Tabarre", label: "Tabarre" },
      { value: "Croix-des-Bouquets", label: "Croix-des-Bouquets" },
      { value: "Kenscoff", label: "Kenscoff" },
      { value: "Ganthier", label: "Ganthier" },
      { value: "Cornillon", label: "Cornillon" }
    ]
  },
  {
    value: "Nord",
    label: "Nord",
    cities: [
      { value: "Cap-Haïtien", label: "Cap-Haïtien" },
      { value: "Limbé", label: "Limbé" },
      { value: "Acul-du-Nord", label: "Acul-du-Nord" },
      { value: "Milot", label: "Milot" },
      { value: "Plaine-du-Nord", label: "Plaine-du-Nord" },
      { value: "Quartier-Morin", label: "Quartier-Morin" },
      { value: "Borgne", label: "Borgne" },
      { value: "Grande-Rivière-du-Nord", label: "Grande-Rivière-du-Nord" }
    ]
  },
  {
    value: "Sud",
    label: "Sud",
    cities: [
      { value: "Les Cayes", label: "Les Cayes" },
      { value: "Aquin", label: "Aquin" },
      { value: "Cavaillon", label: "Cavaillon" },
      { value: "Chantal", label: "Chantal" },
      { value: "Côteaux", label: "Côteaux" },
      { value: "Port-à-Piment", label: "Port-à-Piment" },
      { value: "Roche-à-Bateaux", label: "Roche-à-Bateaux" },
      { value: "Saint-Jean-du-Sud", label: "Saint-Jean-du-Sud" },
      { value: "Tiburon", label: "Tiburon" }
    ]
  },
  {
    value: "Artibonite",
    label: "Artibonite",
    cities: [
      { value: "Gonaïves", label: "Gonaïves" },
      { value: "Dessalines", label: "Dessalines" },
      { value: "Gros-Morne", label: "Gros-Morne" },
      { value: "Marmelade", label: "Marmelade" },
      { value: "Saint-Marc", label: "Saint-Marc" },
      { value: "Verrettes", label: "Verrettes" },
      { value: "Ennery", label: "Ennery" },
      { value: "L'Estère", label: "L'Estère" },
      { value: "Petite-Rivière-de-l'Artibonite", label: "Petite-Rivière-de-l'Artibonite" }
    ]
  },
  {
    value: "Centre",
    label: "Centre",
    cities: [
      { value: "Hinche", label: "Hinche" },
      { value: "Cerca-la-Source", label: "Cerca-la-Source" },
      { value: "Lascahobas", label: "Lascahobas" },
      { value: "Mirebalais", label: "Mirebalais" },
      { value: "Boucan-Carré", label: "Boucan-Carré" },
      { value: "Saut-d'Eau", label: "Saut-d'Eau" },
      { value: "Thomassique", label: "Thomassique" }
    ]
  },
  {
    value: "Nord-Est",
    label: "Nord-Est",
    cities: [
      { value: "Fort-Liberté", label: "Fort-Liberté" },
      { value: "Ouanaminthe", label: "Ouanaminthe" },
      { value: "Trou-du-Nord", label: "Trou-du-Nord" },
      { value: "Vallières", label: "Vallières" },
      { value: "Caracol", label: "Caracol" },
      { value: "Mont-Organisé", label: "Mont-Organisé" }
    ]
  },
  {
    value: "Nord-Ouest",
    label: "Nord-Ouest",
    cities: [
      { value: "Port-de-Paix", label: "Port-de-Paix" },
      { value: "Bombardopolis", label: "Bombardopolis" },
      { value: "Jean-Rabel", label: "Jean-Rabel" },
      { value: "Môle-Saint-Nicolas", label: "Môle-Saint-Nicolas" },
      { value: "Baie-de-Henne", label: "Baie-de-Henne" },
      { value: "Chansolme", label: "Chansolme" }
    ]
  },
  {
    value: "Grand'Anse",
    label: "Grand'Anse",
    cities: [
      { value: "Jérémie", label: "Jérémie" },
      { value: "Anse-d'Hainault", label: "Anse-d'Hainault" },
      { value: "Dame-Marie", label: "Dame-Marie" },
      { value: "Irois", label: "Irois" },
      { value: "Corail", label: "Corail" },
      { value: "Pestel", label: "Pestel" },
      { value: "Roseaux", label: "Roseaux" }
    ]
  },
  {
    value: "Nippes",
    label: "Nippes",
    cities: [
      { value: "Miragoâne", label: "Miragoâne" },
      { value: "Anse-à-Veau", label: "Anse-à-Veau" },
      { value: "Baradères", label: "Baradères" },
      { value: "Fonds-des-Nègres", label: "Fonds-des-Nègres" },
      { value: "L'Asile", label: "L'Asile" },
      { value: "Petit-Trou-de-Nippes", label: "Petit-Trou-de-Nippes" }
    ]
  },
  {
    value: "Sud-Est",
    label: "Sud-Est",
    cities: [
      { value: "Jacmel", label: "Jacmel" },
      { value: "Bainet", label: "Bainet" },
      { value: "Belle-Anse", label: "Belle-Anse" },
      { value: "Côte-de-Fer", label: "Côte-de-Fer" },
      { value: "Grand-Gosier", label: "Grand-Gosier" },
      { value: "Marigot", label: "Marigot" },
      { value: "Thiotte", label: "Thiotte" }
    ]
  }
];

// Fonction pour obtenir les villes d'un département
export const getCitiesForDepartment = (departmentValue: string): CityConfig[] => {
  const department = DEPARTMENTS.find(d => d.value === departmentValue);
  return department?.cities || [];
};

// Fonction pour valider une combinaison département/ville
export const validateDepartmentCity = (department: string, city: string): boolean => {
  if (!department) return false;
  
  const cities = getCitiesForDepartment(department);
  if (cities.length === 0) {
    return !city || city === '';
  }
  
  return cities.some(c => c.value === city);
};

// Fonction pour obtenir le label complet d'un département/ville
export const getDepartmentCityLabel = (department: string, city?: string): string => {
  const departmentConfig = DEPARTMENTS.find(d => d.value === department);
  if (!departmentConfig) return department;
  
  if (!city || city === '') {
    return departmentConfig.label;
  }
  
  const cityConfig = departmentConfig.cities.find(c => c.value === city);
  if (cityConfig) {
    return `${departmentConfig.label} - ${cityConfig.label}`;
  }
  
  return `${departmentConfig.label} - ${city}`;
};
