import React from "react";
import styled from "styled-components";

const Shell = styled.main`
    max-width: 1240px;
    margin: 0 auto;
`;

export default function PlatformContent({ children }) {
    return <Shell>{children}</Shell>;
}


