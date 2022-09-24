import React, {useState} from 'react';
import { browserHistory } from 'react-router';
import { Field, Form } from 'react-final-form';
import withGoBack from '../../redux/HOC/withGoBack';
import withLoader from '../../redux/HOC/withLoader';
import withNotify from '../../redux/HOC/withNotify';
import withUser from '../../redux/HOC/withUser';
import { onGoBack } from '../../common/globals';
import { renderField, required } from '../../helpers/form-validations';
import { ITIlogin } from '../../utils/utils';
import Header from '../Header';
import OTPInput from "otp-input-react";
import {store} from "../../redux/store";
import {loaderSet, notifySet} from "../../redux/actions";
import {APPLICATION_ID} from "../../common/config";

const ITILogin = ({
  goBack, setGoBack, setLoader, setNotify, setUser,
}) => {
  const [OTP, setOTP] = useState('');
  const onSubmit = async (formData) => {
    if(OTP.length<4){
      store.dispatch(notifySet({
        type: 'error',
        message: 'PIN should be of 4 digit',
      }));
      return;
    }
    const reqData = {
      "loginId": formData.username,
      "password": OTP,
      "applicationId": APPLICATION_ID
    };
    setLoader(true);
    const Res = await ITIlogin(reqData);
    if(Res){
      const { responseCode, message, result } = Res;
      if (responseCode === 'OK') {
        setUser({ ...result.data });
        setNotify({ message: 'Login successfully', type: 'success' });
        goBack.push(window.location.pathname);
        setGoBack(goBack);
        browserHistory.push('/iti-welcome');
      } else {
        setNotify({ message: message || "can't login", type: 'error' });
      }
    }
    setLoader(false);
  };
  const onBack = () => {
    onGoBack(goBack);
  };

  return (
    <div>
      <Header />
      <div className="m-10 font-bold text-2xl text-teal-800 text-center">
        <h2 className="header-text-color">ITI Log in</h2>
      </div>
      <div className="flex justify-center items-center">
        <Form
          onSubmit={onSubmit}
          render={({ handleSubmit }) => (
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <div className="mb-4">
                <label className="block text-teal-700 text-sm font-bold mb-2" htmlFor="username">
                  Enter Username
                </label>
                <Field
                  className="shadow appearance-none border border-teal-600 rounded w-full py-2 px-3 text-teal-700 leading-tight focus:outline-none focus:shadow-outline"
                  name="username"
                  type="text"
                  id="username"
                  validate={required}
                >
                  {renderField}
                </Field>
              </div>
              <div className="mb-4">
                <label className="block text-teal-700 text-sm font-bold mb-2" htmlFor="username">
                  Enter PIN
                </label>
                <OTPInput
                      value={OTP}
                      onChange={setOTP}
                      OTPLength={4}
                      otpType="number"
                      inputStyles={{ border: 'teal 1px solid' }}
                  />
              </div>
              <div className="p-10 flex item-center justify-center">
                <button
                  onClick={onBack}
                  type="button"
                  className="bg-teal-700 text-white p-2 text-lg w-auto"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 text-white p-2 ml-6 text-lg w-auto"
                >
                  Submit
                </button>
              </div>
            </form>
          )}
        />
      </div>
    </div>
  );
};
export default withUser(withNotify(withLoader(withGoBack(ITILogin))));