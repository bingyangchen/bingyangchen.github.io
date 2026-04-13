import airflowLogo from "../assets/airflow_logo.svg";
import awsLogo from "../assets/aws_logo.svg";
import cypressLogo from "../assets/cypress_logo.svg";
import djangoLogo from "../assets/django_logo.svg";
import dockerLogo from "../assets/docker_logo.svg";
import elasticsearchLogo from "../assets/elasticsearch_logo.svg";
import fastapiLogo from "../assets/fastapi_logo.svg";
import gitLogo from "../assets/git_logo.svg";
import graphqlLogo from "../assets/graphql_logo.svg";
import javascriptLogo from "../assets/javascript_logo.svg";
import metaLogo from "../assets/meta_logo.svg";
import mysqlLogo from "../assets/mysql_logo.svg";
import postgresqlLogo from "../assets/postgresql_logo.svg";
import pythonLogo from "../assets/python_logo.svg";
import rabbitmqLogo from "../assets/rabbitmq_logo.svg";
import reactLogo from "../assets/react_logo.svg";
import redisLogo from "../assets/redis_logo.svg";
import typescriptLogo from "../assets/typescript_logo.svg";
import vueLogo from "../assets/vue_logo.svg";

import type { SkillItem } from "../types";

export const homeSkillItems: SkillItem[] = [
  { id: "python", title: "Python", logo: pythonLogo },
  { id: "typescript", title: "TypeScript", logo: typescriptLogo },
  { id: "javascript", title: "JavaScript", logo: javascriptLogo },
  { id: "mysql", title: "MySQL", logo: mysqlLogo },
  { id: "postgresql", title: "PostgreSQL", logo: postgresqlLogo },
  { id: "redis", title: "Redis", logo: redisLogo },
  { id: "elasticsearch", title: "Elasticsearch", logo: elasticsearchLogo },
  { id: "rabbitmq", title: "RabbitMQ", logo: rabbitmqLogo },
  { id: "airflow", title: "Airflow", logo: airflowLogo },
  { id: "django", title: "Django", logo: djangoLogo },
  { id: "fastapi", title: "FastAPI", logo: fastapiLogo },
  { id: "react", title: "React", logo: reactLogo },
  { id: "vue", title: "Vue", logo: vueLogo },
  { id: "git", title: "Git", logo: gitLogo },
  { id: "docker", title: "Docker", logo: dockerLogo },
  { id: "aws", title: "AWS", logo: awsLogo },
  { id: "graphql", title: "GraphQL", logo: graphqlLogo },
  { id: "cypress", title: "Cypress", logo: cypressLogo },
  { id: "meta-api", title: "Meta API", logo: metaLogo },
];
