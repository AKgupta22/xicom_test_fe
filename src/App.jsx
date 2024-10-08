import {
  Input,
  Flex,
  DatePicker,
  Typography,
  Checkbox,
  Select,
  Upload,
  Button,
} from "antd";
import "./App.css";
import InputFieldWithLabel from "./components/InputFieldWithLabel";
import { useState } from "react";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useFormik } from "formik";
import moment from "moment";
import axios from "./utils/axios";
import * as Yup from "yup";

function App() {
  const [fileList, setFileList] = useState([
    {
      id: crypto.randomUUID(),
      file_name: "",
      file_type: "pdf",
      file: null,
    },
    {
      id: crypto.randomUUID(),
      file_name: "",
      file_type: "pdf",
      file: null,
    },
  ]);

  const validationSchema = Yup.object({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    dob: Yup.date()
      .nullable()
      .required("Date of birth is required")
      .test("dob", "You must be at least 18 years old", function (value) {
        return moment().diff(moment(value), "years") >= 18;
      }),
    residence_address: Yup.object({
      street_1: Yup.string().required("Residence Street 1 is required"),
      street_2: Yup.string().required("Residence Street 2 is required"),
    }),
    permanent_address: Yup.object()
      .shape()
      .test("permanent_address", null, function (value) {
        if (this.parent?.isSameResidence) {
          return true;
        }
        const errors = {};

        if (!value?.street_1) {
          errors.street_1 = "Permanent Street 1 is required";
        }

        if (!value?.street_2) {
          errors.street_2 = "Permanent Street 2 is required";
        }

        if (Object.keys(errors).length > 0) {
          return this.createError({
            path: "permanent_address",
            message: errors,
          });
        }
        return false;
      }),
    isSameResidence: Yup.boolean(),
  });

  const formatDate = (dateInput) => {
    if (!dateInput) return null;
    const momentDate = dateInput.$d
      ? moment(dateInput.$d)
      : moment(
          dateInput,
          ["DD/MM/YYYY", moment.ISO_8601, "YYYY-MM-DD", "MM/DD/YYYY"],
          true
        );

    if (!momentDate.isValid()) return null;

    return momentDate.format("DD/MM/YYYY");
  };

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      dob: null,
      residence_address: {
        street_1: "",
        street_2: "",
      },
      permanent_address: {
        street_1: "",
        street_2: "",
      },
      isSameResidence: false,
    },
    validationSchema,
    onSubmit: async (values, handlers) => {
      const { isSameResidence, ...restValue } = values;
      restValue.isPermanentSameAsResidence = isSameResidence;
      const files = fileList.map((fileData) => fileData.file);
      if (files.includes(null)) {
        alert("Upload all files");
        return;
      }
      const formData = new FormData();

      formData.append("first_name", restValue.first_name || "");
      formData.append("last_name", restValue.last_name || "");
      formData.append("email", restValue.email || "");

      const formattedDOB = formatDate(restValue.dob);
      formData.append("dob", formattedDOB || "");

      formData.append(
        "residence_address[street1]",
        restValue.residence_address?.street_1 || ""
      );
      formData.append(
        "residence_address[street2]",
        restValue.residence_address?.street_2 || ""
      );

      if (!isSameResidence) {
        formData.append(
          "permanent_address[street1]",
          restValue.permanent_address?.street_1 || ""
        );
        formData.append(
          "permanent_address[street2]",
          restValue.permanent_address?.street_2 || ""
        );
      } else {
        formData.append("permanent_address", "");
      }

      formData.append(
        "isPermanentSameAsResidence",
        restValue.isPermanentSameAsResidence
      );

      if (Array.isArray(files)) {
        files.forEach((file) => {
          formData.append(`files`, file);
        });
      }
      try {
        handlers.setSubmitting(true);
        const res = await axios.post("candidates", formData);
        handlers.setSubmitting(false);
        handlers.resetForm();
        setFileList([
          {
            id: crypto.randomUUID(),
            file_name: "",
            file_type: "pdf",
            file: null,
          },
          {
            id: crypto.randomUUID(),
            file_name: "",
            file_type: "pdf",
            file: null,
          },
        ]);
        alert(res.data?.message);
      } catch (error) {
        handlers.setSubmitting(false);
        alert(error?.response?.data?.message || "Failed");
      }
    },
  });
  const handleNewFile = () => {
    const newFileData = {
      id: crypto.randomUUID(),
      file_name: "",
      file_type: "pdf",
      file: null,
    };
    const newFileList = [...fileList];
    newFileList.push(newFileData);
    setFileList(newFileList);
  };

  const handleRemoveFile = (id) => {
    let newFileList = [...fileList];
    newFileList = newFileList.filter((file) => file.id !== id);
    setFileList(newFileList);
  };

  const handleAddImages = (selectedFile, file) => {
    if (!selectedFile.file_name?.trim() || !selectedFile.file_type) {
      alert("Please enter file name");
      return;
    }
    if (!file.type?.includes(selectedFile?.file_type)) {
      alert("Invalid file file type");
      return;
    }
    const newFileList = [...fileList];
    let currentIndex = newFileList.findIndex(
      (file) => file.id === selectedFile.id
    );
    if (currentIndex !== -1) {
      newFileList[currentIndex]["file"] = file;
    }
    setFileList(newFileList);
  };

  const getFileName = (file_name) => {
    return file_name?.slice(0, 5) + "...";
  };

  const handleChangeFileField = (id, name, value) => {
    let newFileList = [...fileList];
    let currentIndex = newFileList.findIndex((file) => file.id === id);
    if (currentIndex !== -1) {
      newFileList[currentIndex][name] = value;
      if (name === "file_type") newFileList[currentIndex]["file"] = null;
    }
    setFileList(newFileList);
  };

  return (
    <div className="main-container">
      <div className="main-container_form">
        <form className="common-wh" onSubmit={formik.handleSubmit}>
          <Flex wrap gap={"1rem"} style={{ marginBottom: "1rem" }}>
            <InputFieldWithLabel label={"First Name"}>
              <Input
                size="large"
                type="text"
                name="first_name"
                placeholder="Enter your first name"
                value={formik.values.first_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.first_name && formik.errors.first_name && (
                <div style={{ color: "#9f2c2c", fontSize: "12px" }}>
                  {formik.errors.first_name}
                </div>
              )}
            </InputFieldWithLabel>
            <InputFieldWithLabel label={"Last Name"}>
              <Input
                size="large"
                type="text"
                name="last_name"
                placeholder="Enter your last name"
                value={formik.values.last_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.last_name && formik.errors.last_name && (
                <div style={{ color: "#9f2c2c", fontSize: "12px" }}>
                  {formik.errors.last_name}
                </div>
              )}
            </InputFieldWithLabel>
          </Flex>

          <Flex wrap gap={"1rem"} style={{ marginBottom: "1rem" }}>
            <InputFieldWithLabel label={"Email"}>
              <Input
                size="large"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <div style={{ color: "#9f2c2c", fontSize: "12px" }}>
                  {formik.errors.email}
                </div>
              )}
            </InputFieldWithLabel>
            <InputFieldWithLabel label={"Date of Birth (YYYY/MM/DD)"}>
              <DatePicker
                size="large"
                name="dob"
                placeholder="Enter your dob"
                value={formik.values.dob}
                onChange={(date) => formik.setFieldValue("dob", date)}
                onBlur={formik.handleBlur}
              />
              {formik.touched.dob && formik.errors.dob && (
                <div style={{ color: "#9f2c2c", fontSize: "12px" }}>
                  {formik.errors.dob}
                </div>
              )}
            </InputFieldWithLabel>
          </Flex>

          <Typography.Title level={5}>Residence Address</Typography.Title>
          <Flex wrap gap={"1rem"} style={{ marginBottom: "1rem" }}>
            <InputFieldWithLabel label={"Street 1"}>
              <Input
                size="large"
                type="text"
                name="residence_address.street_1"
                placeholder="Enter your street address 1"
                value={formik.values.residence_address.street_1}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.residence_address?.street_1 &&
                formik.errors.residence_address?.street_1 && (
                  <div style={{ color: "#9f2c2c", fontSize: "12px" }}>
                    {formik.errors.residence_address.street_1}
                  </div>
                )}
            </InputFieldWithLabel>
            <InputFieldWithLabel label={"Street 2"}>
              <Input
                size="large"
                type="text"
                name="residence_address.street_2"
                placeholder="Enter your street address 2"
                value={formik.values.residence_address.street_2}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.residence_address?.street_2 &&
                formik.errors.residence_address?.street_2 && (
                  <div style={{ color: "#9f2c2c", fontSize: "12px" }}>
                    {formik.errors.residence_address.street_2}
                  </div>
                )}
            </InputFieldWithLabel>
          </Flex>

          <Checkbox
            checked={formik.values.isSameResidence}
            onChange={(e) => {
              formik.setFieldValue("isSameResidence", e.target.checked);
            }}
            style={{ color: "#fff" }}
          >
            Same as Residence
          </Checkbox>

          {!formik.values.isSameResidence && (
            <>
              <Typography.Title level={5}>Permanent Address</Typography.Title>
              <Flex wrap gap={"1rem"} style={{ marginBottom: "1rem" }}>
                <InputFieldWithLabel label={"Street 1"}>
                  <Input
                    size="large"
                    type="text"
                    name="permanent_address.street_1"
                    placeholder="Enter your street address 1"
                    value={formik.values.permanent_address.street_1}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.permanent_address?.street_1 &&
                    formik.errors.permanent_address?.street_1 && (
                      <div style={{ color: "#9f2c2c", fontSize: "12px" }}>
                        {formik.errors.permanent_address.street_1}
                      </div>
                    )}
                </InputFieldWithLabel>
                <InputFieldWithLabel label={"Street 2"}>
                  <Input
                    size="large"
                    type="text"
                    name="permanent_address.street_2"
                    placeholder="Enter your street address 2"
                    value={formik.values.permanent_address.street_2}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.permanent_address?.street_2 &&
                    formik.errors.permanent_address?.street_2 && (
                      <div style={{ color: "#9f2c2c", fontSize: "12px" }}>
                        {formik.errors.permanent_address.street_2}
                      </div>
                    )}
                </InputFieldWithLabel>
              </Flex>
            </>
          )}

          <Flex vertical gap={"1rem"}>
            <Flex vertical gap={"5px"}>
              <Typography.Title level={5}>Upload Documents</Typography.Title>
              <Button
                onClick={handleNewFile}
                icon={<PlusCircleOutlined onClick={handleNewFile} />}
              />
            </Flex>

            {fileList.map((file, index) => (
              <Flex
                key={file.id}
                gap={"1rem"}
                style={{ marginBottom: "1rem" }}
                align="center"
              >
                <InputFieldWithLabel label={"File Name"}>
                  <Input
                    type="text"
                    name="file_name"
                    placeholder="File name"
                    onChange={({ target: { name, value } }) =>
                      handleChangeFileField(file.id, name, value)
                    }
                  />
                </InputFieldWithLabel>
                <InputFieldWithLabel label={"File type"}>
                  <Select
                    options={[
                      { value: "jpeg", label: <span>JPEG</span> },
                      { value: "pdf", label: <span>PDF</span> },
                      { value: "jpg", label: <span>JPG</span> },
                      { value: "png", label: <span>PNG</span> },
                    ]}
                    placeholder="Select file type"
                    value={file.file_type}
                    onChange={(val, option) =>
                      handleChangeFileField(file.id, "file_type", option.value)
                    }
                  />
                </InputFieldWithLabel>
                <InputFieldWithLabel label={"Select File"}>
                  <Upload
                    showUploadList={false}
                    multiple={false}
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    beforeUpload={(selectedFile) =>
                      handleAddImages(file, selectedFile)
                    }
                  >
                    <Button icon={<UploadOutlined />}>
                      {file.file ? getFileName(file.file?.name) : "Browse"}
                    </Button>
                  </Upload>
                </InputFieldWithLabel>
                {index > 1 ? (
                  <InputFieldWithLabel label={"Remove"}>
                    <Button
                      onClick={() => handleRemoveFile(file.id)}
                      icon={<DeleteOutlined />}
                    />
                  </InputFieldWithLabel>
                ) : null}
              </Flex>
            ))}
          </Flex>
          <Flex style={{ paddingBottom: "1rem" }}>
            <Button disabled={formik.isSubmitting} htmlType="submit">
              {formik.isSubmitting ? "Please wait..." : "Save"}
            </Button>
          </Flex>
        </form>
      </div>
    </div>
  );
}

export default App;
