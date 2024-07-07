import React, { Component } from "react";
import { Grid, Message, Icon } from "semantic-ui-react";

export default class Footer extends Component {
	render() {
		return (
			<Grid.Row>
				<Grid.Column width={12}>
					<Message color={"grey"}>
						<b>
							Made with <Icon name="heart" color="red" fitted /> by{" "}
							<a href="/" style={{ textDecoration: "none" }}>
								Anjishnu Ganguly
							</a>
						</b>
					</Message>
				</Grid.Column>
			</Grid.Row>
		);
	}
}
