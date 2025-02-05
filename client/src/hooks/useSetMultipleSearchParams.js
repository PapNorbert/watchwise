import { useSearchParams } from "react-router-dom";


export default function useSetMultipleSearchParams() {
  // eslint-disable-next-line
  const [searchParams, setSearchParams] = useSearchParams();
  
  function setMultipleSearchParams(paramNames, paramValues, toDeleteParams = []) {
    if (paramNames.length !== paramValues.length) {
      return false;
    }
    setSearchParams((searchParams) => {
      for (let i = 0; i < paramNames.length; i++) {
        searchParams.set(paramNames[i], paramValues[i]);
      }
      for (let i = 0; i < toDeleteParams.length; i++) {
        searchParams.delete(toDeleteParams[i]);
      }
      return searchParams;
    });
    return true;
  };

  return [setMultipleSearchParams];
}
