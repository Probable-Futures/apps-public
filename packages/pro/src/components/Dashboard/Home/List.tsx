import Item from "./Item";

const documentationList = [
  {
    title: "Getting started",
    link: "https://probablefutures.org/pro-how-to-videos/",
    description:
      "Probable Futures Pro has many features. Watch these <a href='https://probablefutures.org/pro-how-to-videos' target='_blank' rel='noopener noreferrer'>how-to videos</a> to learn how to get started and use some of the more advanced and useful features available such as enrichment and filtering.",
  },
  {
    title: "About climate models",
    link: "https://probablefutures.org/science/?tab=climate-models",
    description:
      "At their best, climate models help us manage the unavoidable and avoid the unmanageable. In other words, they can help us envision what is coming well enough to plan for the futures we likely cannot avoid and motivate action to avoid the futures that could include unmanageable outcomes. Read about the background, strengths, and limitations of climate models here.",
  },
  {
    title: "Behind our maps",
    link: "https://probablefutures.org/science/?tab=our-maps",
    description:
      "Learn about the climate data in this tool and about the scientific and methodological choices we made while building it.",
  },
];

const List = () => (
  <div>
    {documentationList.map((doc, index) => (
      <Item key={index} title={doc.title} description={doc.description} link={doc.link} />
    ))}
  </div>
);

export default List;
