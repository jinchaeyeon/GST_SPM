import React, { useCallback, useEffect, useState } from "react";
import { useApi } from "../../hooks/api";
import { bytesToBase64 } from "byte-base64";
import { MultiSelect, MultiSelectChangeEvent } from '@progress/kendo-react-dropdowns';

interface Item { code_name: string, sub_code: number }

type TCustomOptionComboBox = {
    name: string;
    changeData(e: any): void;
    queryStr: string;
  };

const MultiSelectDrop = ({  name, changeData, queryStr} : TCustomOptionComboBox) => {
  const [value, setValue] = React.useState<Item[]>([]);
  const processApi = useApi();
  const [listData, setListData] = useState<Item[]>([]);

  useEffect(()=> {
    fetchData();
  }, [])

  const fetchData = useCallback(async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(queryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("query", query);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rows = data.tables[0].Rows;

      setListData(rows); //리스트 세팅
    }
  }, []);

    const isCustom = (item: Item) =>{ return item.sub_code === undefined; }
    const addKey = (item: Item) => { item.sub_code = new Date().getTime(); }

    const handleChange = (event: MultiSelectChangeEvent) => {
        const values = event.target.value;
        const lastItem = values[values.length - 1];

        if (lastItem && isCustom(lastItem)) {
            values.pop();
            const sameItem = values.find(v => v.code_name === lastItem.code_name);
            if (sameItem === undefined) {
                addKey(lastItem);
                values.push(lastItem);
            }
        }

        setValue(values)
        let text = "";
        values.map((number) => {
            text = text + number.sub_code + "|";
        });
        changeData({ name, text });
    }

        return (
          <div>
            <MultiSelect
              data={listData}
              onChange={handleChange}
              value={value}
              textField="code_name"
              dataItemKey="sub_code"
              allowCustom={true}
              style={{ width: '300px' }}
            />
          </div>
        );

}

export default MultiSelectDrop;
