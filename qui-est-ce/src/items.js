// Illustration coordinates match the six-column, four-row generated atlas.
export const ITEMS = [
  { id: "ballon", name: "Le ballon" },
  { id: "trottinette", name: "La trottinette" },
  { id: "console", name: "La console" },
  { id: "ordinateur", name: "L’ordinateur" },
  { id: "livre", name: "Le livre" },
  { id: "casque", name: "Le casque" },
  { id: "telephone", name: "Le téléphone" },
  { id: "lunettes", name: "Les lunettes", plural: true },
  { id: "sac-a-dos", name: "Le sac à dos" },
  { id: "trousse", name: "La trousse" },
  { id: "stylo", name: "Le stylo" },
  { id: "crayons-de-couleur", name: "Les crayons de couleur", plural: true },
  { id: "colle", name: "La colle" },
  { id: "feutre", name: "Le feutre", crop: { x: 265, y: 510, size: 242 } },
  { id: "crayon-a-papier", name: "Le crayon à papier" },
  { id: "ciseaux", name: "Les ciseaux", plural: true },
  { id: "table", name: "La table", crop: { x: 1029, y: 506, size: 244 } },
  { id: "gomme", name: "La gomme" },
  { id: "regle", name: "La règle" },
  { id: "chaise", name: "La chaise", crop: { x: 256, y: 744, size: 256 } },
  { id: "skate", name: "Le skate" },
  { id: "velo", name: "Le vélo" },
  {
    id: "chaussons-de-danse",
    name: "Les chaussons de danse",
    plural: true,
    crop: { x: 1024, y: 748, size: 256 },
  },
].map((item, index) => ({ ...item, index }));

export const ITEM_BY_ID = Object.fromEntries(
  ITEMS.map((item) => [item.id, item]),
);
export const ITEM_IDS = ITEMS.map((item) => item.id);

export function questionFor(item) {
  return `${item.plural ? "Ce sont" : "C’est"} ${item.name.toLocaleLowerCase("fr")} ?`;
}
