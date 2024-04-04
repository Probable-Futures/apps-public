import * as DocBlock from "@storybook/blocks";

const AdditionalDocs = ({
  whatIsIt,
  whenAndHowToUse,
  currentUsage,
}: {
  whatIsIt: string;
  whenAndHowToUse: string;
  currentUsage: string;
}) => {
  return (
    <>
      <DocBlock.Heading>What is this component</DocBlock.Heading>
      <DocBlock.Description>{whatIsIt}</DocBlock.Description>
      <DocBlock.Heading>When & how to use it?</DocBlock.Heading>
      <DocBlock.Description>{whenAndHowToUse}</DocBlock.Description>
      <DocBlock.Heading>Current usage</DocBlock.Heading>
      <DocBlock.Description>{currentUsage}</DocBlock.Description>
    </>
  );
};

export default AdditionalDocs;
