export async function getRandomGif() {
  const searchQuery = "dog";
  const gfycatApiUrl = `https://api.gfycat.com/v1/gfycats/search?search_text=${searchQuery}`;
  const response = await fetch(gfycatApiUrl);
  const data = await response.json();
  const randomIndex = Math.floor(Math.random() * data.gfycats.length);
  const gifUrl = data.gfycats[randomIndex].max2mbGif;
  const container = $("#gif-container");
  container.empty();
  const imgElement = $("<img>");
  imgElement.attr("src", gifUrl);
  container.append(imgElement);
}