import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AuctionItem {
  id: number;
  name: string;
  description: string;
  image: string;
  actual_price: number;
  year: string;
}

const items: AuctionItem[] = [
  {
    id: 1,
    name: "Mona Lisa",
    description: "Painted by Leonardo da Vinci, c. 1503–1519. The world's most famous portrait.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
    actual_price: 860000000,
    year: "1503",
  },
  {
    id: 2,
    name: "The Scream",
    description: "By Edvard Munch, 1895 pastel version. Sold at auction in 2012.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/The_Scream.jpg/800px-The_Scream.jpg",
    actual_price: 119900000,
    year: "1895",
  },
  {
    id: 3,
    name: "Salvator Mundi",
    description: "Attributed to Leonardo da Vinci. Most expensive painting ever sold at auction.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Leonardo_da_Vinci%2C_Salvator_Mundi%2C_c.1500%2C_oil_on_walnut%2C_45.4_%C3%97_65.6_cm.jpg/800px-Leonardo_da_Vinci%2C_Salvator_Mundi%2C_c.1500%2C_oil_on_walnut%2C_45.4_%C3%97_65.6_cm.jpg",
    actual_price: 450300000,
    year: "2017",
  },
  {
    id: 4,
    name: "Les Femmes d'Alger (Version O)",
    description: "By Pablo Picasso, 1955. Sold at Christie's New York.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Pablo_Picasso%2C_1910-11%2C_Guitariste%2C_La_mandoliniste%2C_Woman_playing_guitar%2C_oil_on_canvas.jpg/800px-Pablo_Picasso%2C_1910-11%2C_Guitariste%2C_La_mandoliniste%2C_Woman_playing_guitar%2C_oil_on_canvas.jpg",
    actual_price: 179400000,
    year: "1955",
  },
  {
    id: 5,
    name: "No. 5, 1948",
    description: "By Jackson Pollock. One of the most expensive paintings ever sold privately.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Jackson_Pollock%27s_studio_in_Springs%2C_New_York.jpg/800px-Jackson_Pollock%27s_studio_in_Springs%2C_New_York.jpg",
    actual_price: 140000000,
    year: "1948",
  },
  {
    id: 6,
    name: "The Starry Night",
    description: "By Vincent van Gogh, 1889. Housed at MoMA, estimated insurance value.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
    actual_price: 200000000,
    year: "1889",
  },
  {
    id: 7,
    name: "Girl with a Pearl Earring",
    description: "By Johannes Vermeer, c. 1665. The 'Mona Lisa of the North.'",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg",
    actual_price: 30000000,
    year: "1665",
  },
  {
    id: 8,
    name: "1962 Ferrari 250 GTO",
    description: "The most expensive car ever sold at auction. Only 36 were made.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/1962_Ferrari_250_GTO_%28chassis_3851GT%29_at_Goodwood_Revival_2012.jpg/1280px-1962_Ferrari_250_GTO_%28chassis_3851GT%29_at_Goodwood_Revival_2012.jpg",
    actual_price: 48405000,
    year: "1962",
  },
  {
    id: 9,
    name: "Codex Leicester",
    description: "Leonardo da Vinci's scientific manuscript. Bought by Bill Gates in 1994.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Vinci_-_Hammer_2A.jpg/800px-Vinci_-_Hammer_2A.jpg",
    actual_price: 30800000,
    year: "1994",
  },
  {
    id: 10,
    name: "Action Comics #1",
    description: "First appearance of Superman, 1938. The holy grail of comic books.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Superman_first_comic.jpg/800px-Superman_first_comic.jpg",
    actual_price: 3250000,
    year: "1938",
  },
  {
    id: 11,
    name: "The Persistence of Memory",
    description: "By Salvador Dalí, 1931. The iconic melting clocks painting.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Salvador_Dal%C3%AD_1939.jpg/800px-Salvador_Dal%C3%AD_1939.jpg",
    actual_price: 150000000,
    year: "1931",
  },
  {
    id: 12,
    name: "Water Lilies (Nymphéas)",
    description: "By Claude Monet, 1906. Part of his famous series of approximately 250 oil paintings.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg",
    actual_price: 80000000,
    year: "1906",
  },
  {
    id: 13,
    name: "The Kiss",
    description: "By Gustav Klimt, 1907–1908. Austria's most famous painting.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/800px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg",
    actual_price: 240000000,
    year: "1908",
  },
  {
    id: 14,
    name: "The Great Wave off Kanagawa",
    description: "By Katsushika Hokusai, c. 1831. One of the most recognizable works of Japanese art.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg",
    actual_price: 2760000,
    year: "1831",
  },
  {
    id: 15,
    name: "The Birth of Venus",
    description: "By Sandro Botticelli, c. 1485. A masterpiece of the Italian Renaissance.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/1280px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg",
    actual_price: 500000000,
    year: "1485",
  },
  {
    id: 16,
    name: "American Gothic",
    description: "By Grant Wood, 1930. One of the most familiar images in 20th-century American art.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Grant_Wood_-_American_Gothic_-_Google_Art_Project.jpg/800px-Grant_Wood_-_American_Gothic_-_Google_Art_Project.jpg",
    actual_price: 30000000,
    year: "1930",
  },
  {
    id: 17,
    name: "Nighthawks",
    description: "By Edward Hopper, 1942. An iconic portrayal of urban isolation.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Nighthawks_by_Edward_Hopper_1942.jpg/1280px-Nighthawks_by_Edward_Hopper_1942.jpg",
    actual_price: 40000000,
    year: "1942",
  },
  {
    id: 18,
    name: "1963 Ferrari 250 GT Lusso",
    description: "A rare classic Ferrari. Only 350 were ever produced.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Ferrari_250_GT_Lusso_%2814229198819%29.jpg/1280px-Ferrari_250_GT_Lusso_%2814229198819%29.jpg",
    actual_price: 2300000,
    year: "1963",
  },
  {
    id: 19,
    name: "Declaration of Independence (Dunlap Broadside)",
    description: "One of 26 surviving copies of the first printing of the Declaration of Independence.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/United_States_Declaration_of_Independence.jpg/800px-United_States_Declaration_of_Independence.jpg",
    actual_price: 8100000,
    year: "1776",
  },
  {
    id: 20,
    name: "Stradivarius 'Lady Blunt' Violin",
    description: "Made by Antonio Stradivari in 1721. One of the finest instruments ever crafted.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Stradivarius_violin_front.jpg/800px-Stradivarius_violin_front.jpg",
    actual_price: 15900000,
    year: "1721",
  },
  {
    id: 21,
    name: "Hope Diamond",
    description: "A 45.52-carat deep-blue diamond. One of the most famous jewels in the world.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/The_Hope_Diamond_-_SIA.jpg/800px-The_Hope_Diamond_-_SIA.jpg",
    actual_price: 250000000,
    year: "1958",
  },
  {
    id: 22,
    name: "T-Rex Skeleton 'Stan'",
    description: "One of the most complete T-Rex fossils ever found. Sold at Christie's in 2020.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Stan_the_Trex_at_Manchester_Museum.jpg/800px-Stan_the_Trex_at_Manchester_Museum.jpg",
    actual_price: 31800000,
    year: "2020",
  },
  {
    id: 23,
    name: "Honus Wagner Baseball Card",
    description: "The T206 card from 1909. The most valuable baseball card in history.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Honus_Wagner%2C_Pittsburgh_Pirates%2C_baseball_card_portrait_LCCN2007685756.tif/lossy-page1-800px-Honus_Wagner%2C_Pittsburgh_Pirates%2C_baseball_card_portrait_LCCN2007685756.tif.jpg",
    actual_price: 7250000,
    year: "1909",
  },
  {
    id: 24,
    name: "The Codex Hammer",
    description: "A collection of Leonardo da Vinci's scientific writings. Purchased by Bill Gates.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Vinci_-_Hammer_2A.jpg/800px-Vinci_-_Hammer_2A.jpg",
    actual_price: 30800000,
    year: "1994",
  },
  {
    id: 25,
    name: "Interchange",
    description: "By Willem de Kooning, 1955. Sold privately for a record price in 2015.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Willem_de_Kooning_in_his_studio.jpg/800px-Willem_de_Kooning_in_his_studio.jpg",
    actual_price: 300000000,
    year: "1955",
  },
  {
    id: 26,
    name: "Shot Sage Blue Marilyn",
    description: "By Andy Warhol, 1964. Most expensive American artwork ever sold at auction.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Andy_Warhol_by_Jack_Mitchell.jpg/800px-Andy_Warhol_by_Jack_Mitchell.jpg",
    actual_price: 195000000,
    year: "1964",
  },
  {
    id: 27,
    name: "The Card Players",
    description: "By Paul Cézanne, c. 1892. Sold privately to the Royal Family of Qatar.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Les_Joueurs_de_cartes%2C_par_Paul_C%C3%A9zanne%2C_Yorck.jpg/1280px-Les_Joueurs_de_cartes%2C_par_Paul_C%C3%A9zanne%2C_Yorck.jpg",
    actual_price: 250000000,
    year: "1892",
  },
  {
    id: 28,
    name: "Guernica",
    description: "By Pablo Picasso, 1937. A powerful anti-war masterpiece. Estimated insurance value.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Pablo_Picasso%2C_1962.jpg/800px-Pablo_Picasso%2C_1962.jpg",
    actual_price: 200000000,
    year: "1937",
  },
  {
    id: 29,
    name: "Rolex Daytona 'Paul Newman'",
    description: "The most expensive wristwatch ever sold at auction. Owned by Paul Newman himself.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Rolex-Cosmograph-Daytona-6239.jpg/800px-Rolex-Cosmograph-Daytona-6239.jpg",
    actual_price: 17800000,
    year: "2017",
  },
  {
    id: 30,
    name: "Inverted Jenny Stamp",
    description: "A 1918 US airmail stamp with an upside-down airplane. Extremely rare misprint.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/US_Airmail_inverted_Jenny_24c_1918_issue.jpg/800px-US_Airmail_inverted_Jenny_24c_1918_issue.jpg",
    actual_price: 1593000,
    year: "1918",
  },
  {
    id: 31,
    name: "Imperial Jade Dragon Vase",
    description: "Qing-style carved jade ceremonial vase with dragon motifs.",
    image: "/auction-images/imperial-jade-dragon-vase.jpg",
    actual_price: 12000000,
    year: "1760",
  },
  {
    id: 32,
    name: "Sun King Ceremonial Sword",
    description: "French court presentation sword with gilt hilt and engraved blade.",
    image: "/auction-images/sun-king-ceremonial-sword.jpg",
    actual_price: 9800000,
    year: "1690",
  },
  {
    id: 33,
    name: "Moonlit Samurai Armor",
    description: "Complete Edo-period samurai armor with lacquered plates.",
    image: "/auction-images/moonlit-samurai-armor.jpg",
    actual_price: 7400000,
    year: "1735",
  },
  {
    id: 34,
    name: "Pharaoh Gold Mask Replica",
    description: "Museum-grade recreation inspired by New Kingdom funerary masks.",
    image: "/auction-images/pharaoh-gold-mask-replica.jpg",
    actual_price: 2100000,
    year: "1922",
  },
  {
    id: 35,
    name: "Byzantine Enamel Cross",
    description: "Gold and enamel devotional cross from a late Byzantine workshop.",
    image: "/auction-images/byzantine-enamel-cross.jpg",
    actual_price: 5600000,
    year: "1320",
  },
  {
    id: 36,
    name: "Mughal Emerald Dagger",
    description: "Jade-hilt dagger with emerald inlay and floral engraving.",
    image: "/auction-images/mughal-emerald-dagger.jpg",
    actual_price: 6900000,
    year: "1650",
  },
  {
    id: 37,
    name: "Roman Senator Bust",
    description: "Marble portrait bust attributed to an imperial Roman atelier.",
    image: "/auction-images/roman-senator-bust.jpg",
    actual_price: 8400000,
    year: "120",
  },
  {
    id: 38,
    name: "Viking Runestone Tablet",
    description: "Carved stone slab with reconstructed Norse runic inscription.",
    image: "/auction-images/viking-runestone-tablet.jpg",
    actual_price: 4300000,
    year: "980",
  },
  {
    id: 39,
    name: "Aztec Turquoise Serpent",
    description: "Ceremonial mosaic serpent figure with shell and turquoise tesserae.",
    image: "/auction-images/aztec-turquoise-serpent.jpg",
    actual_price: 11200000,
    year: "1500",
  },
  {
    id: 40,
    name: "Qing Phoenix Jar",
    description: "Porcelain famille-rose jar painted with phoenix medallions.",
    image: "/auction-images/qing-phoenix-jar.jpg",
    actual_price: 7800000,
    year: "1780",
  },
  {
    id: 41,
    name: "Art Deco Platinum Brooch",
    description: "Geometric platinum brooch set with old-cut diamonds.",
    image: "/auction-images/art-deco-platinum-brooch.jpg",
    actual_price: 3400000,
    year: "1928",
  },
  {
    id: 42,
    name: "Victorian Automaton Bird",
    description: "Singing mechanical bird in gilt case with enamel panels.",
    image: "/auction-images/victorian-automaton-bird.jpg",
    actual_price: 4100000,
    year: "1885",
  },
  {
    id: 43,
    name: "Edwardian Sapphire Tiara",
    description: "Platinum tiara with cushion sapphires and diamond scrollwork.",
    image: "/auction-images/edwardian-sapphire-tiara.jpg",
    actual_price: 9700000,
    year: "1910",
  },
  {
    id: 44,
    name: "Apollo Space Checklist",
    description: "Flight-era mission checklist with annotated engineering notes.",
    image: "/auction-images/apollo-space-checklist.jpg",
    actual_price: 1650000,
    year: "1969",
  },
  {
    id: 45,
    name: "Beatles Abbey Road Proof",
    description: "Early proof print from the iconic Abbey Road cover session.",
    image: "/auction-images/beatles-abbey-road-proof.jpg",
    actual_price: 720000,
    year: "1969",
  },
  {
    id: 46,
    name: "First Edition Hobbit",
    description: "First printing fantasy classic in near-fine condition with dust jacket.",
    image: "/auction-images/first-edition-hobbit.jpg",
    actual_price: 520000,
    year: "1937",
  },
  {
    id: 47,
    name: "Einstein Letter on Relativity",
    description: "Signed correspondence discussing foundational relativity concepts.",
    image: "/auction-images/einstein-letter-relativity.jpg",
    actual_price: 1300000,
    year: "1921",
  },
  {
    id: 48,
    name: "Tesla Lab Notebook Page",
    description: "Handwritten engineering page from a high-voltage experiment notebook.",
    image: "/auction-images/tesla-lab-notebook-page.jpg",
    actual_price: 890000,
    year: "1901",
  },
  {
    id: 49,
    name: "Chaplin Bowler Hat",
    description: "Film-era bowler associated with the Tramp screen persona.",
    image: "/auction-images/chaplin-bowler-hat.jpg",
    actual_price: 640000,
    year: "1932",
  },
  {
    id: 50,
    name: "Marilyn Stage Gloves",
    description: "Performance-worn evening gloves from a studio publicity era.",
    image: "/auction-images/marilyn-stage-gloves.jpg",
    actual_price: 390000,
    year: "1955",
  },
  {
    id: 51,
    name: "Jordan Rookie Card GEM",
    description: "High-grade rookie trading card slabbed by a top grading service.",
    image: "/auction-images/jordan-rookie-card-gem.jpg",
    actual_price: 1800000,
    year: "1986",
  },
  {
    id: 52,
    name: "Pele Signed World Cup Ball",
    description: "Match-style ball signed by Pele with event provenance.",
    image: "/auction-images/pele-signed-worldcup-ball.jpg",
    actual_price: 320000,
    year: "1970",
  },
  {
    id: 53,
    name: "Federer Wimbledon Racquet",
    description: "Tournament-use racquet linked to a championship grass-court run.",
    image: "/auction-images/federer-wimbledon-racquet.jpg",
    actual_price: 460000,
    year: "2006",
  },
  {
    id: 54,
    name: "Olympic Torch Munich 72",
    description: "Official relay torch from the 1972 Olympic Games.",
    image: "/auction-images/olympic-torch-munich72.jpg",
    actual_price: 210000,
    year: "1972",
  },
  {
    id: 55,
    name: "Formula 1 Helmet Vintage",
    description: "Race-worn helmet from a late 1970s grand prix season.",
    image: "/auction-images/formula1-helmet-vintage.jpg",
    actual_price: 530000,
    year: "1978",
  },
  {
    id: 56,
    name: "Lunar Meteorite Slice",
    description: "Polished slice of moon-origin meteorite with matrix detail.",
    image: "/auction-images/lunar-meteorite-slice.jpg",
    actual_price: 280000,
    year: "1999",
  },
  {
    id: 57,
    name: "Martian Shergottite Stone",
    description: "Documented Martian meteorite specimen with scientific report.",
    image: "/auction-images/martian-shergottite-stone.jpg",
    actual_price: 350000,
    year: "2005",
  },
  {
    id: 58,
    name: "Amber Insect Fossil",
    description: "Large Baltic amber with exceptionally preserved prehistoric insect.",
    image: "/auction-images/amber-insect-fossil.jpg",
    actual_price: 160000,
    year: "47000000 BCE",
  },
  {
    id: 59,
    name: "Triceratops Horn Fossil",
    description: "Prepared fossil horn core from a late Cretaceous Triceratops.",
    image: "/auction-images/triceratops-horn-fossil.jpg",
    actual_price: 710000,
    year: "68000000 BCE",
  },
  {
    id: 60,
    name: "Woolly Mammoth Tusk",
    description: "Siberian permafrost mammoth tusk with natural curvature.",
    image: "/auction-images/woolly-mammoth-tusk.jpg",
    actual_price: 240000,
    year: "12000 BCE",
  },
  {
    id: 61,
    name: "Rare Comic Batman #1",
    description: "Golden Age superhero issue featuring an early Batman run.",
    image: "/auction-images/rare-comic-batman1.jpg",
    actual_price: 2900000,
    year: "1940",
  },
  {
    id: 62,
    name: "First Map Pacific Chart",
    description: "Early printed navigation chart depicting trans-Pacific routes.",
    image: "/auction-images/first-map-pacific-chart.jpg",
    actual_price: 980000,
    year: "1570",
  },
  {
    id: 63,
    name: "Renaissance Astrolabe",
    description: "Brass astronomic instrument with engraved rete and rule.",
    image: "/auction-images/renaissance-astrolabe.jpg",
    actual_price: 760000,
    year: "1565",
  },
  {
    id: 64,
    name: "Steam Locomotive Nameplate",
    description: "Cast brass plate from a celebrated intercity steam engine.",
    image: "/auction-images/steam-locomotive-nameplate.jpg",
    actual_price: 190000,
    year: "1913",
  },
  {
    id: 65,
    name: "Antique Mariner Compass",
    description: "Gimballed ship compass from a long-range merchant vessel.",
    image: "/auction-images/antique-mariner-compass.jpg",
    actual_price: 130000,
    year: "1850",
  },
  {
    id: 66,
    name: "Orient Express Menu 1928",
    description: "Luxury dining menu card from the Paris-Istanbul route.",
    image: "/auction-images/orient-express-menu-1928.jpg",
    actual_price: 85000,
    year: "1928",
  },
  {
    id: 67,
    name: "Deco Neon Cinema Sign",
    description: "Restored Art Deco marquee lettering from a city picture house.",
    image: "/auction-images/deco-neon-cinema-sign.jpg",
    actual_price: 220000,
    year: "1936",
  },
  {
    id: 68,
    name: "Vintage Arcade Cabinet",
    description: "Fully working upright arcade cabinet with original controls.",
    image: "/auction-images/vintage-arcade-cabinet.jpg",
    actual_price: 145000,
    year: "1981",
  },
  {
    id: 69,
    name: "Prototype Apple Computer",
    description: "Early personal computing prototype from a garage-era build.",
    image: "/auction-images/prototype-apple-computer.jpg",
    actual_price: 4200000,
    year: "1976",
  },
  {
    id: 70,
    name: "Early Gameboy Dev Kit",
    description: "Hand-assembled developer hardware for handheld game testing.",
    image: "/auction-images/early-gameboy-dev-kit.jpg",
    actual_price: 175000,
    year: "1989",
  },
  {
    id: 71,
    name: "Soviet Space Poster",
    description: "Original lithographic propaganda poster from the space race period.",
    image: "/auction-images/soviet-space-poster.jpg",
    actual_price: 92000,
    year: "1961",
  },
  {
    id: 72,
    name: "Japanese Woodblock Triptych",
    description: "Three-panel Edo print sequence with vibrant natural pigments.",
    image: "/auction-images/japanese-woodblock-triptych.jpg",
    actual_price: 310000,
    year: "1848",
  },
  {
    id: 73,
    name: "Baroque Violin Masterpiece",
    description: "Italian baroque violin attributed to a Cremona workshop.",
    image: "/auction-images/baroque-violin-masterpiece.jpg",
    actual_price: 2300000,
    year: "1715",
  },
  {
    id: 74,
    name: "Persian Miniature Album",
    description: "Illuminated manuscript album with courtly miniature paintings.",
    image: "/auction-images/persian-miniature-album.jpg",
    actual_price: 680000,
    year: "1610",
  },
  {
    id: 75,
    name: "Ottoman Calligraphy Panel",
    description: "Framed calligraphic panel in gold and lapis pigment.",
    image: "/auction-images/ottoman-calligraphy-panel.jpg",
    actual_price: 260000,
    year: "1755",
  },
  {
    id: 76,
    name: "African Bronze Royal Head",
    description: "Court-style bronze head cast by lost-wax tradition.",
    image: "/auction-images/african-bronze-royal-head.jpg",
    actual_price: 1570000,
    year: "1500",
  },
  {
    id: 77,
    name: "Inca Gold Ritual Cup",
    description: "Ceremonial cup in high-karat gold from Andean ritual tradition.",
    image: "/auction-images/inca-gold-ritual-cup.jpg",
    actual_price: 1860000,
    year: "1450",
  },
  {
    id: 78,
    name: "Maori Pounamu Pendant",
    description: "Greenstone pendant carved in traditional taonga form.",
    image: "/auction-images/maori-pounamu-pendant.jpg",
    actual_price: 98000,
    year: "1800",
  },
  {
    id: 79,
    name: "Polynesian Navigation Chart",
    description: "Stick chart representing swell patterns and island positions.",
    image: "/auction-images/polynesian-navigation-chart.jpg",
    actual_price: 420000,
    year: "1875",
  },
  {
    id: 80,
    name: "Silk Road Caravan Diary",
    description: "Travel journal documenting overland trade route logistics.",
    image: "/auction-images/silk-road-caravan-diary.jpg",
    actual_price: 540000,
    year: "1420",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (path === "items") {
      // Return items WITHOUT prices
      const safeItems = items.map(({ actual_price, ...rest }) => rest);
      // Shuffle
      const shuffled = [...safeItems].sort(() => Math.random() - 0.5);
      return new Response(JSON.stringify(shuffled), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "guess" && req.method === "POST") {
      const { itemId, guess } = await req.json();
      const item = items.find((i) => i.id === itemId);
      if (!item) {
        return new Response(JSON.stringify({ error: "Item not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const actual = item.actual_price;
      const difference = Math.abs(guess - actual);
      const percentOff = (difference / actual) * 100;
      const score = Math.max(0, Math.round(1000 - (difference / actual) * 1000));

      return new Response(
        JSON.stringify({
          actual_price: actual,
          guess,
          difference,
          percent_off: Math.round(percentOff * 10) / 10,
          score,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
