import React from "react";
import styled from "styled-components";

const Shell = styled.main`
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
`;

export default function PlatformContent({ children }) {
    return <Shell>{children}</Shell>;
}


