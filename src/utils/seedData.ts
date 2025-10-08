import vampireImg from "@/assets/contestant-vampire.jpg";
import superheroImg from "@/assets/contestant-superhero.jpg";
import witchImg from "@/assets/contestant-witch.jpg";
import zombieImg from "@/assets/contestant-zombie.jpg";
import robotImg from "@/assets/contestant-robot.jpg";
import knightImg from "@/assets/contestant-knight.jpg";

export const sampleContestants = [
  {
    name: "Count Dracula Returns",
    description: "Classic vampire with a modern twist - complete with dramatic cape and mesmerizing red eyes",
    image_url: vampireImg,
    vote_count: Math.floor(Math.random() * 15) + 5
  },
  {
    name: "Captain Spectrum",
    description: "Colorful superhero costume with custom mask and vibrant rainbow cape",
    image_url: superheroImg,
    vote_count: Math.floor(Math.random() * 15) + 5
  },
  {
    name: "Enchanted Sorceress",
    description: "Elegant witch costume featuring flowing robes and mystical pointed hat",
    image_url: witchImg,
    vote_count: Math.floor(Math.random() * 15) + 5
  },
  {
    name: "The Undead Walker",
    description: "Terrifyingly realistic zombie with detailed makeup and tattered clothing",
    image_url: zombieImg,
    vote_count: Math.floor(Math.random() * 15) + 5
  },
  {
    name: "Cyber-Knight 3000",
    description: "Futuristic robot costume with LED lights and metallic armor plating",
    image_url: robotImg,
    vote_count: Math.floor(Math.random() * 15) + 5
  },
  {
    name: "Sir Galahad the Brave",
    description: "Medieval knight with authentic-looking armor and ceremonial sword",
    image_url: knightImg,
    vote_count: Math.floor(Math.random() * 15) + 5
  }
];
