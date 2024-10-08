import { Flex, Typography } from "antd";

// eslint-disable-next-line react/prop-types
const InputFieldWithLabel = ({ label, children }) => {
  return (
    <Flex vertical gap={"12px"}>
      <Typography.Text style={{ fontWeight: "600", color: "#fff" }}>
        {label}
      </Typography.Text>
      {children}
    </Flex>
  );
};

export default InputFieldWithLabel;
