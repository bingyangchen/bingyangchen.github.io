import styles from "./WorkExperience.module.scss";

import React from "react";

interface Props {
    work_duration: string;
    job_title: string;
    company_name: string;
    company_logo?: string;
    company_link?: string;
    description: string;
    skills?: string[];
}

interface State {}

export default class WorkExperience extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <div className={styles.main}>
                <div className={styles.left}>
                    <div className={styles.head} />
                    <div className={styles.line} />
                </div>
                <div className={styles.body}>
                    <div className={styles.work_duration}>
                        {this.props.work_duration}
                    </div>
                    <div className={styles.job_title}>
                        {this.props.job_title}
                    </div>
                    {this.props.company_link ? (
                        <a
                            className={styles.company_name}
                            href={this.props.company_link}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {this.props.company_logo && (
                                <img
                                    className={styles.company_logo}
                                    src={this.props.company_logo}
                                    alt={this.props.company_name}
                                />
                            )}
                            {this.props.company_name}
                        </a>
                    ) : (
                        <div className={styles.company_name}>
                            {this.props.company_logo && (
                                <img
                                    className={styles.company_logo}
                                    src={this.props.company_logo}
                                    alt={this.props.company_name}
                                />
                            )}
                            {this.props.company_name}
                        </div>
                    )}
                    <div className={styles.description}>
                        {this.props.description}
                    </div>
                    {this.props.skills && (
                        <div className={styles.tech_stack}>
                            <div className={styles.title}>技能</div>
                            <div className={styles.list}>
                                {this.props.skills.map((skill, idx) => {
                                    return (
                                        <code
                                            className={styles.skill_tag}
                                            key={idx}
                                        >
                                            {skill}
                                        </code>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
