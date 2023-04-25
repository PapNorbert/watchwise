import { useSearchParams } from "react-router-dom";

export function useSearchParamsState(searchParamName, defaultValue) {

  const [searchParams, setSearchParams] = useSearchParams();
  const acquiredSearchParam = searchParams.get(searchParamName);
  const searchParamsState = acquiredSearchParam ?? defaultValue;

  function setSearchParamsState(newState) {
    setSearchParams((searchParams) => {
      searchParams.set(searchParamName, newState);
      return searchParams;
    });
  };

  function setMultipleSearchParams(paramNames, paramValues) {
    if (paramNames.length !== paramValues.length) {
      return false;
    }
    setSearchParams((searchParams) => {
      for (let i = 0; i < paramNames.length; i++) {
        searchParams.set(paramNames[i], paramValues[i]);
      }
      return searchParams;
    });
    return true;
  };

  return [searchParamsState, setSearchParamsState, setMultipleSearchParams];
}