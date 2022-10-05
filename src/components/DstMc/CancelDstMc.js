import { onGoBack } from '../../common/globals';
import withGoBack from '../../redux/HOC/withGoBack';
import Header from '../Header';
import formSpecJSON from "./cancelWorkflow.json";
import React, { useState, useEffect } from 'react';
import {
  deleteDstMc,
  getFilteredBatch, getFilteredIndustry,
  getFilteredTrades,
  getIndustriesList,
  getITIsList,
  getLoggedInITIDetails
} from "../../utils/utils";
import withNotify from "../../redux/HOC/withNotify";
import withLoader from "../../redux/HOC/withLoader";
import withUser from "../../redux/HOC/withUser";

const CancelDstMc = ({ goBack, setLoader, user, setNotify }) => {
  const [userDetails, setUserDetails] = useState({});
  const [industries, setIndustries] = useState([]);


  const [currentIti, setCurrentIti] = useState('');
  const [trades, setTrades] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredIndustries, setFilteredIndustries] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedFilteredIndustry, setSelectedFilteredIndustry] = useState('');

  const onBack = () => {
    onGoBack(goBack);
  };

  const formSpec = formSpecJSON;
  const [isFirst, setIsFirst] = useState(true);
  // Encode string method to URI
  const encodeFunction = (func) => encodeURIComponent(JSON.stringify(func));


  const getFormURI = (form, ofsd, prefillSpec) => {
    console.log(form, ofsd, prefillSpec);
    return encodeURIComponent(`${process.env.REACT_APP_GET_FORM}/prefill?form=${form}&onFormSuccessData=${encodeFunction(ofsd)}&prefillSpec=${encodeFunction(prefillSpec)}`);
  };

  const startingForm = formSpec.start;
  const [formId, setFormId] = useState(startingForm);
  const [encodedFormSpec, setEncodedFormSpec] = useState(encodeURI(JSON.stringify(formSpec.forms[formId])));
  const [onFormSuccessData, setOnFormSuccessData] = useState(undefined);
  const [onFormFailureData, setOnFormFailureData] = useState(undefined);
  const [encodedFormURI, setEncodedFormURI] = useState(getFormURI(formId, formSpec.forms[formId].onSuccess, formSpec.forms[formId].prefill));


  function afterFormSubmit(e) {
    const data = JSON.parse(e.data);
    try {
      /* message = {
        nextForm: "formID",
        formData: {},
      }
      */
      const { nextForm, formData, onSuccessData, onFailureData } = data;
      if (data.state == 'ON_FORM_SUCCESS_COMPLETED') {
        console.log('formData', formData);
        /*const reqData = {
          id: formData.id
        };

        deleteDstMc(reqData).then((res) => {
          setNotify({ message: 'Form Created Successfully', type: 'success' });
        });*/
      }
      if (nextForm.type === 'form') {
        setFormId(nextForm.id);
        setOnFormSuccessData(onSuccessData);
        setOnFormFailureData(onFailureData);
        setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
        setEncodedFormURI(getFormURI(nextForm.id, onSuccessData, formSpec.forms[nextForm.id].prefill));
      } else {
        window.location.href = nextForm.url;
      }
    }
    catch (e) {
      // console.log(e)
    }
  }

  const fetchUserDetails = async () => {
    setLoader(true);
    const reqData = {
      itiName: user?.user?.user?.username || ''
    };
    const { data: { principal } } = await getLoggedInITIDetails(reqData);
    setUserDetails(principal[0]);
    formSpec.forms[formId].prefill.district2 = "`" + `${principal[0]?.district}` + "`";
    formSpec.forms[formId].prefill.ITI2 = "`" + `${principal[0]?.iti}` + "`";
    setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
    setEncodedFormURI(getFormURI(formId, formSpec.forms[formId].onSuccess, formSpec.forms[formId].prefill));
    setLoader(false);
  };

  const fetchITIsList = async () => {
    const data = await getITIsList();
    const currentITI = data.data.iti.find((item) => item.name == user?.user?.user?.username).id;
    setCurrentIti(currentITI);
    fetchIndustriesList();
    fetchFilteredTrades(currentITI);
  };

  const fetchIndustriesList = async () => {
    const data = await getIndustriesList();
    setIndustries(data.data.industry);
  };

  const bindEventListener = () => {
    window.removeEventListener('message', (e) => { afterFormSubmit(e); });
    window.setTimeout(() => {
      window.addEventListener('message', (e) => { afterFormSubmit(e); });
    }, 1500);
  };

  useEffect(() => {
    bindEventListener();
  }, [selectedFilteredIndustry]);

  useEffect(() => {
    fetchITIsList();
    fetchUserDetails();
  }, []);


  // =========================================================

  /*const fetchITIsList = async () => {
    const data = await getITIsList();
    const currentITI = data.data.iti.find((item) => item.name == user?.user?.user?.username).id;
    setCurrentIti(currentITI);
    fetchFilteredTrades(currentITI);
  };*/

  const fetchFilteredTrades = async (currentITI) => {
    const reqData = {
      itiId: currentITI
    };
    const { data: { dst_mc_meeting } } = await getFilteredTrades(reqData);
    const list = dst_mc_meeting.map((item) => item.trade);
    setTrades(list);
  };

  const onTradesSelect = async (value) => {
    const reqData = {
      itiId: currentIti,
      trade: value
    };
    setSelectedTrade(value);
    const { data: { dst_mc_meeting } } = await getFilteredBatch(reqData);
    const list = dst_mc_meeting.map((item) => item.batch);
    setBatches(list);
    setFilteredIndustries([]);
  };

  const onBatchSelect = async (value) => {
    const reqData = {
      itiId: currentIti,
      trade: selectedTrade,
      batch: value
    };
    setSelectedBatch(value);
    const { data: { dst_mc_meeting } } = await getFilteredIndustry(reqData);
    const list = dst_mc_meeting.map((item) => item.industry);
    setFilteredIndustries(list);
    setSelectedFilteredIndustry('');
  };

  const onIndustrySelect = async (value) => {
    setSelectedFilteredIndustry(event.target.value);
    formSpec.forms[formId].prefill.dst_trade2 = "`" + `${selectedTrade}` + "`";
    formSpec.forms[formId].prefill.dst_batch2 = "`" + `${selectedBatch}` + "`";
    formSpec.forms[formId].prefill.industry_partner2 = "`" + `${value}` + "`";
    setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
    setEncodedFormURI(getFormURI(formId, formSpec.forms[formId].onSuccess, formSpec.forms[formId].prefill));
  };

  /*useEffect(() => {
    fetchITIsList();
  }, []);*/


  return (
    <div>
      <Header title="Create DST MC" onBackButton={onBack} />
      <div className="text-center text-teal-700">
        <select className="form-select appearance-none px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          name="trade" id="trade"
          onChange={(event) => { onBatchSelect(event.target.value); }}
        >
          <option value="">Select Batch</option>
          {
            batches && batches.length > 0 && batches.map((item) => <option key={item} value={item}>{item}</option>)
          }
        </select>

        <select className="form-select appearance-none px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          name="filteredIndustries" id="filteredIndustries"
          onChange={(event) => { onIndustrySelect(event.target.value); }}
        >
          <option value="">Select Industry</option>
          {
            filteredIndustries && filteredIndustries.length > 0 && filteredIndustries.map((item) => <option value={item.id}>{item.name}</option>)
          }
        </select>

      </div>
      {
        filteredIndustries && filteredIndustries.length > 0 && selectedFilteredIndustry && <div className="text-center text-teal-700">
          <iframe title='current-form'
            key={+new Date()}
            style={{ height: "100vh", width: "100vw" }}
            src={
              `${process.env.REACT_APP_ENKETO}/preview?formSpec=${encodedFormSpec}&xform=${encodedFormURI}`
            }
          />
        </div>
      }
    </div>
  );
};

export default withNotify(withLoader(withUser(withGoBack(CancelDstMc))));
