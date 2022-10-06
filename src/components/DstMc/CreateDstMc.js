import { onGoBack } from '../../common/globals';
import withGoBack from '../../redux/HOC/withGoBack';
import Header from '../Header';
import formSpecJSON from "./workflow.json";
import React, { useState, useEffect } from 'react';
import { createDstMc, getLoggedInITIDetails, getIndustriesList, getITIsList } from '../../utils/utils';
import withLoader from "../../redux/HOC/withLoader";
import withUser from "../../redux/HOC/withUser";
import withNotify from "../../redux/HOC/withNotify";

const CreateDstMc = ({ goBack, setLoader, user, setNotify }) => {
  const [userDetails, setUserDetails] = useState({});
  const [currentIti, setCurrentIti] = useState('');
  const [industries, setIndustries] = useState([]);

  const onBack = () => {
    onGoBack(goBack);
  };

  const formSpec = formSpecJSON;
  const [isFirst, setIsFirst] = useState(true);
  // Encode string method to URI
  const encodeFunction = (func) => encodeURIComponent(JSON.stringify(func));


  const getFormURI = (form, ofsd, prefillSpec) => encodeURIComponent(`${process.env.REACT_APP_GET_FORM}/prefill?form=${form}&onFormSuccessData=${encodeFunction(ofsd)}&prefillSpec=${encodeFunction(prefillSpec)}`);

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
        let reqData = [];
        if (Array.isArray(formData.Create_DSTMC.MC_Information)) {
          reqData = formData.Create_DSTMC.MC_Information.map((item) => {
            const industryId = industries.find((industry) => industry.name == item.industry_partner1).id;
            if (!industryId) {
              return {};
            }
            return {
              "iti_id": currentIti,
              "district": formData?.Create_DSTMC?.district1,
              "trade": formData?.Create_DSTMC?.dst_trade1,
              "batch": formData?.Create_DSTMC?.dst_batch1,
              "note": formData?.Create_DSTMC?.note2,
              "mc_number": formData?.Create_DSTMC?.MC_number,
              "mc_information_count": formData?.Create_DSTMC?.MC_Information_count,
              "instance_id": formData?.meta?.instanceID,
              "industry_id": industryId,
              "trainer_name": item?.trainer_name,
              "trainer_contact": item?.trainer_contact,
              "trainer_email": item?.trainer_email,
              "head_name": item?.head_name,
              "head_contact": item?.head_Contact,
              "head_email": item?.head_email,
              "sup_name": item?.sup_name,
              "sup_contact": item?.sup_Contact,
              "sup_email": item?.sup_email
            };
          });

          if (currentIti && reqData.every((item) => item.iti_id)) {
            createDstMc(reqData).then((res) => {
              setNotify({ message: 'Form Created Successfully', type: 'success' });
            });
          } else {
            setNotify({ message: 'Can not create meeting', type: 'error' });
          }
        }
        else {
          const industryId = industries.find((industry) => industry.name == formData?.Create_DSTMC?.MC_Information.industry_partner1).id;
          if (!industryId) {
            reqData = {};
          } else {
            reqData = {
              "iti_id": currentIti,
              "district": formData?.Create_DSTMC?.district1,
              "trade": formData?.Create_DSTMC?.dst_trade1,
              "batch": formData?.Create_DSTMC?.dst_batch1,
              "note": formData?.Create_DSTMC?.note2,
              "mc_number": formData?.Create_DSTMC?.MC_number,
              "mc_information_count": formData?.Create_DSTMC?.MC_Information_count,
              "instance_id": formData?.meta?.instanceID,
              "industry_id": industryId,
              "trainer_name": formData?.Create_DSTMC?.MC_Information?.trainer_name,
              "trainer_contact": formData?.Create_DSTMC?.MC_Information?.trainer_contact,
              "trainer_email": formData?.Create_DSTMC?.MC_Information?.trainer_email,
              "head_name": formData?.Create_DSTMC?.MC_Information?.head_name,
              "head_contact": formData?.Create_DSTMC?.MC_Information?.head_Contact,
              "head_email": formData?.Create_DSTMC?.MC_Information?.head_email,
              "sup_name": formData?.Create_DSTMC?.MC_Information?.sup_name,
              "sup_contact": formData?.Create_DSTMC?.MC_Information?.sup_Contact,
              "sup_email": formData?.Create_DSTMC?.MC_Information?.sup_email
            };

            if (currentIti && reqData.iti_id) {
              createDstMc(reqData).then((res) => {
                setNotify({ message: 'Form Created Successfully', type: 'success' });
              });
            } else {
              setNotify({ message: 'Can not create meeting', type: 'error' });
            }
          }
        }
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
    formSpec.forms[formId].prefill.district1 = "`" + `${principal[0]?.district}` + "`";
    formSpec.forms[formId].prefill.ITI1 = "`" + `${principal[0]?.iti}` + "`";
    setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
    setEncodedFormURI(getFormURI(formId, formSpec.forms[formId].onSuccess, formSpec.forms[formId].prefill));
    setLoader(false);
  };

  const fetchITIsList = async () => {
    const data = await getITIsList();
    const currentITI = data.data.iti.find((item) => item.name == user?.user?.user?.username).id;
    setCurrentIti(currentITI);
    fetchIndustriesList();
  };

  const fetchIndustriesList = async () => {
    const data = await getIndustriesList();
    setIndustries(data.data.industry);
  };

  const bindEventListener = () => {
    window.addEventListener('message', (e) => { afterFormSubmit(e); });
  };

  useEffect(() => {
    bindEventListener();
  }, [industries]);

  useEffect(() => {
    fetchITIsList();
    fetchUserDetails();
  }, []);

  // settimeoiut after a minute

  const getFormData = async () => {
    // send broacast message to iframe
    const iframe = document.getElementById('current-form');
    iframe.contentWindow.postMessage('getFormData', '*');

    // wait for the message from ifram and set a variable
    window.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'formData') {
        setFormData(data.data);
      }
    });

    return Promise.resolve("bla");
  };


  return (
    <div>
      <Header title="Create DST MC" onBackButton={onBack} />
      <div className="text-center text-teal-700">
        <iframe title='current-form'
          style={{ height: "100vh", width: "100vw" }}
          src={
            `${process.env.REACT_APP_ENKETO}/preview?formSpec=${encodedFormSpec}&xform=${encodedFormURI}`
          }
        />
      </div>
    </div>
  );
};

export default withNotify(withLoader(withUser(withGoBack(CreateDstMc))));
