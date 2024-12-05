import styled from "styled-components";

const ResetMapContainer = styled.div`
  position: absolute;
  right: 20px;
  top: calc(50% + 85px);
  transform: translateY(-50%);
  z-index: 1000;
  background-color: white;
  border-radius: 50%;
`;

const ArrowHead = styled.div`
  width: 4px;
  height: 4px;
  border-top: 2px solid black;
  border-right: 2px solid black;
  transform: rotate(72deg);
  position: absolute;
  top: -3px;
  right: 0px;
  transition: border-color 0.3s ease;
`;

const IncompleteCircularArrow = styled.div`
  width: 11px;
  height: 11px;
  border: 2px solid transparent;
  border-top-color: black;
  border-left-color: black;
  border-bottom-color: black;
  border-radius: 50%;
  position: relative;
  transition: border-color 0.3s ease;
`;

const ResetMapButton = styled.button`
  padding: 10px;
  background-color: #fdfdfd;
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  box-shadow: 0 3px 5px 0 rgb(56 22 63 / 50%);
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: black;

    ${IncompleteCircularArrow} {
      border-top-color: white;
      border-left-color: white;
      border-bottom-color: white;
    }

    ${ArrowHead} {
      border-top-color: white;
      border-right-color: white;
    }
  }
`;

const ResetMap = ({ onReset }: { onReset: () => void }) => {
  return (
    <ResetMapContainer>
      <ResetMapButton onClick={onReset}>
        <IncompleteCircularArrow>
          <ArrowHead />
        </IncompleteCircularArrow>
      </ResetMapButton>
    </ResetMapContainer>
  );
};

export default ResetMap;
